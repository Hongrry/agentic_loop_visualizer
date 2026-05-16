import type { LoopStep, ApiResponse, StreamChunk, RuntimeError } from "@/types/runtime";
import { callOpenAIStream, buildToolMessage, buildAssistantToolCallMessage, getApiConfig } from "./openai";
import { toolDefinitions, executeToolCall } from "./tools";

type StepCallback = (step: LoopStep) => void;

type ChatMessage = {
  role: string;
  content: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
  reasoning_content?: string;
};

let stepCounter = 0;

function nextStepId(): string {
  stepCounter += 1;
  return `step-${stepCounter}`;
}

function classifyError(err: unknown): RuntimeError {
  const msg = err instanceof Error ? err.message : "未知错误";
  if (msg.includes("API Key") || msg.includes("401") || msg.includes("无效") || msg.includes("Unauthorized")) {
    return { code: "auth_error", message: "API Key 无效，请检查 VITE_OPENAI_API_KEY 配置", retryable: false };
  }
  if (msg.includes("Rate Limit") || msg.includes("429")) {
    return { code: "rate_limit", message: "API 请求频率超限，请稍后重试", retryable: true };
  }
  if (msg.includes("fetch") || msg.includes("NetworkError") || msg.includes("timeout") || msg.includes("Failed to fetch")) {
    return { code: "network_timeout", message: "网络连接失败，请检查网络后重试", retryable: true };
  }
  const statusMatch = msg.match(/错误\s*\((\d+)\)/);
  if (statusMatch) {
    const status = parseInt(statusMatch[1]);
    if (status >= 500) return { code: "api_error", message: `服务器错误 (${status})，请稍后重试`, retryable: true };
    if (status >= 400) return { code: "api_error", message: `请求错误 (${status})`, retryable: false };
  }
  return { code: "unknown", message: msg, retryable: true };
}

export type LoopResult = {
  steps: LoopStep[];
  messages: ChatMessage[];
  error?: RuntimeError;
};

export async function runAgenticLoop(
  userInput: string,
  onStep: StepCallback,
  existingMessages?: ChatMessage[],
  signal?: AbortSignal
): Promise<LoopResult> {
  const { model, hasKey } = getApiConfig();

  if (!hasKey) {
    throw new Error(
      "未配置 OpenAI API Key。请在项目根目录创建 .env 文件并设置 VITE_OPENAI_API_KEY=sk-xxx"
    );
  }

  const steps: LoopStep[] = [];

  const messages: ChatMessage[] = [
    ...(existingMessages ?? []),
    { role: "user", content: userInput },
  ];

  const contextHistory: string[] = [`用户输入: ${userInput}`];

  const MAX_LOOPS = 8;
  let loopRound = 0;

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    loopRound = loop + 1;
    const thinkStart = Date.now();

    // --- THINK phase ---
    const thinkStep: LoopStep = {
      id: nextStepId(),
      phase: "think",
      title: loop === 0 ? "Agent 分析用户意图" : `Agent 第 ${loop + 1} 轮推理`,
      thought: "正在调用 OpenAI API 进行推理...",
      loopRound,
      contextBefore: [...contextHistory],
      contextAfter: [...contextHistory],
      apiRequest: {
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          tool_calls: m.tool_calls as ApiResponse["tool_calls"],
          tool_call_id: m.tool_call_id,
        })),
        tools: toolDefinitions,
      },
    };
    steps.push(thinkStep);
    onStep(thinkStep);

    let apiResponse: ApiResponse;
    try {
      const builtMessages = messages.map((m) => {
        const msg: {
          role: string;
          content: string;
          tool_calls?: ApiResponse["tool_calls"];
          tool_call_id?: string;
          reasoning_content?: string;
        } = {
          role: m.role,
          content: m.content,
        };
        if (m.tool_calls && m.role === "assistant") {
          msg.tool_calls = m.tool_calls as ApiResponse["tool_calls"];
        }
        if ((m as { reasoning_content?: string }).reasoning_content && m.role === "assistant") {
          msg.reasoning_content = (m as { reasoning_content?: string }).reasoning_content;
        }
        if (m.tool_call_id) {
          msg.tool_call_id = m.tool_call_id;
        }
        return msg;
      });

      apiResponse = await callOpenAIStream(
        {
          model,
          messages: builtMessages,
          tools: toolDefinitions,
        },
        (chunk: StreamChunk) => {
          // Real-time streaming update
          let displayText = "";
          if (chunk.reasoning_content) {
            displayText += `[思考] ${chunk.reasoning_content}\n\n`;
          }
          if (chunk.content) {
            displayText += chunk.content;
          }
          if (!displayText && chunk.toolCalls.length > 0) {
            const toolNames = chunk.toolCalls
              .filter((tc) => tc.function.name)
              .map((tc) => tc.function.name)
              .join(", ");
            displayText = toolNames ? `正在准备调用工具: ${toolNames}...` : "正在分析...";
          }

          thinkStep.thought = displayText || "正在调用 OpenAI API 进行推理...";
          thinkStep.apiResponse = {
            finish_reason: (chunk.finish_reason as ApiResponse["finish_reason"]) ?? "stop",
            content: chunk.content || undefined,
            reasoning_content: chunk.reasoning_content || undefined,
            tool_calls: chunk.toolCalls.length > 0
              ? chunk.toolCalls.map((tc) => ({
                  id: tc.id ?? "",
                  type: "function" as const,
                  function: {
                    name: tc.function.name ?? "",
                    arguments: tc.function.arguments,
                  },
                }))
              : undefined,
          };
          steps[steps.length - 1] = { ...thinkStep };
          onStep({ ...thinkStep });
        },
        signal
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { steps, messages, error: { code: "abort", message: "请求已取消", retryable: false } };
      }

      const error = classifyError(err);
      thinkStep.decisionReason = error.message;
      thinkStep.transitionLabel = "执行出错";
      thinkStep.duration = Date.now() - thinkStart;
      steps[steps.length - 1] = { ...thinkStep };
      onStep({ ...thinkStep });

      const errorStep: LoopStep = {
        id: nextStepId(),
        phase: "end",
        title: "执行出错",
        finalAnswer: `API 调用失败: ${error.message}`,
        decisionReason: error.message,
        transitionLabel: "执行出错",
        loopRound,
        contextBefore: [...contextHistory],
        contextAfter: [...contextHistory],
        duration: Date.now() - thinkStart,
      };
      steps.push(errorStep);
      onStep(errorStep);
      return { steps, messages, error };
    }

    const duration = Date.now() - thinkStart;

    // Finalize think step after streaming completes
    let thoughtText = "";
    let decisionText = "";
    let goalText = loop === 0 ? userInput : "继续分析并决定下一步";

    if (apiResponse.tool_calls && apiResponse.tool_calls.length > 0) {
      const toolNames = apiResponse.tool_calls.map((tc) => tc.function.name).join(", ");
      thoughtText = `Agent 决定调用工具: ${toolNames}`;
      decisionText = `调用 ${toolNames}`;
      thinkStep.decisionReason = `用户请求需要调用 ${toolNames} 获取数据`;
      thinkStep.transitionLabel = `调用工具: ${toolNames}`;
    } else if (apiResponse.content) {
      thoughtText = apiResponse.content;
      decisionText = "直接输出答案";
      goalText = "生成最终回答";
      thinkStep.decisionReason = "模型判断信息充足，直接回答";
      thinkStep.transitionLabel = "直接输出答案";
    }

    thinkStep.apiResponse = apiResponse;
    thinkStep.thought = thoughtText || (apiResponse.content?.slice(0, 200) ?? "");
    thinkStep.goal = goalText;
    thinkStep.decision = decisionText;
    thinkStep.duration = duration;

    if (apiResponse.content) {
      thinkStep.contextAfter = [
        ...contextHistory,
        `Agent 回复: ${apiResponse.content.slice(0, 100)}${apiResponse.content.length > 100 ? "..." : ""}`,
      ];
    }

    steps[steps.length - 1] = { ...thinkStep };
    onStep({ ...thinkStep });

    // Check if done (no tool calls)
    if (!apiResponse.tool_calls || apiResponse.tool_calls.length === 0 || apiResponse.finish_reason === "stop") {
      // Push final assistant message to history for multi-turn
      messages.push({
        role: "assistant",
        content: apiResponse.content ?? "",
        reasoning_content: apiResponse.reasoning_content ?? undefined,
      });

      // --- END phase ---
      const endStep: LoopStep = {
        id: nextStepId(),
        phase: "end",
        title: "输出最终答案",
        finalAnswer: apiResponse.content ?? "Agent 未能生成回答。",
        decisionReason: "模型判断信息充足，直接回答",
        transitionLabel: "直接输出答案",
        loopRound,
        contextBefore: [...contextHistory],
        contextAfter: [...contextHistory],
        duration: 0,
      };
      steps.push(endStep);
      onStep(endStep);
      return { steps, messages };
    }

    // Push assistant message once (with all tool_calls) before processing individual tools
    const assistantMsg = buildAssistantToolCallMessage(
      apiResponse.content ?? null,
      apiResponse.tool_calls,
      apiResponse.reasoning_content ?? null
    );
    messages.push(assistantMsg as unknown as { role: string; content: string; tool_calls?: unknown[]; tool_call_id?: string; reasoning_content?: string });

    // --- ACT phase for each tool call ---
    for (const toolCall of apiResponse.tool_calls) {
      const actStart = Date.now();

      const toolInput = (() => {
        try {
          return JSON.parse(toolCall.function.arguments);
        } catch {
          return {};
        }
      })();

      const actStep: LoopStep = {
        id: nextStepId(),
        phase: "act",
        title: `执行工具调用: ${toolCall.function.name}`,
        toolName: toolCall.function.name,
        toolInput,
        loopRound,
        contextBefore: [...contextHistory],
        contextAfter: [...contextHistory],
      };
      steps.push(actStep);
      onStep(actStep);

      let toolOutput: Record<string, unknown>;
      try {
        toolOutput = await executeToolCall(toolCall);
      } catch (err) {
        toolOutput = {
          error: err instanceof Error ? err.message : "工具执行失败",
        };
      }

      const actDuration = Date.now() - actStart;
      actStep.toolOutput = toolOutput;
      actStep.duration = actDuration;
      steps[steps.length - 1] = { ...actStep };
      onStep({ ...actStep });

      // --- OBSERVE phase ---
      const observeStart = Date.now();

      const prevContext = [...contextHistory];
      const newContextEntries: string[] = [
        `Tool [${toolCall.function.name}] 返回: ${JSON.stringify(toolOutput).slice(0, 200)}`,
      ];
      const afterContext = [...prevContext, ...newContextEntries];

      const observeStep: LoopStep = {
        id: nextStepId(),
        phase: "observe",
        title: "工具结果注入上下文",
        transitionLabel: "信息不足，继续分析",
        loopRound,
        contextBefore: prevContext,
        contextAfter: afterContext,
        newContext: newContextEntries,
        duration: Date.now() - observeStart,
      };
      steps.push(observeStep);
      onStep(observeStep);

      contextHistory.push(...newContextEntries);

      const toolMsg = buildToolMessage(toolCall.id, toolOutput);
      messages.push(toolMsg as unknown as { role: string; content: string; tool_calls?: unknown[]; tool_call_id?: string });
    }
  }

  // Max loops reached
  const exhaustedStep: LoopStep = {
    id: nextStepId(),
    phase: "end",
    title: "达到最大循环次数",
    finalAnswer: `Agent 已达到最大循环次数 (${MAX_LOOPS})，请简化您的问题或稍后重试。`,
    decisionReason: `达到最大循环次数(${MAX_LOOPS}轮)`,
    transitionLabel: "循环终止",
    loopRound,
    contextBefore: [...contextHistory],
    contextAfter: [...contextHistory],
  };
  steps.push(exhaustedStep);
  onStep(exhaustedStep);

  return { steps, messages };
}
