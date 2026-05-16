import type { ApiRequest, ApiResponse, StreamChunk, AccumulatedToolCall } from "@/types/runtime";

const BASE_URL = import.meta.env.VITE_OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY ?? "";
const MODEL = import.meta.env.VITE_OPENAI_MODEL ?? "gpt-4o";

export function getApiConfig() {
  return {
    baseUrl: BASE_URL,
    hasKey: API_KEY.length > 0,
    model: MODEL,
  };
}

export async function callOpenAI(request: ApiRequest, signal?: AbortSignal): Promise<ApiResponse> {
  if (!API_KEY) {
    throw new Error(
      "未配置 OpenAI API Key。请在项目根目录创建 .env 文件并设置 VITE_OPENAI_API_KEY=sk-xxx"
    );
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: request.model || MODEL,
      messages: request.messages,
      tools: request.tools,
      tool_choice: "auto",
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "未知错误");
    if (response.status === 429) {
      throw new Error("API Rate Limit 已达到，请稍后重试。");
    }
    if (response.status === 401) {
      throw new Error("API Key 无效，请检查 VITE_OPENAI_API_KEY 配置。");
    }
    throw new Error(`OpenAI API 错误 (${response.status}): ${errorBody}`);
  }

  const data = await response.json();

  const choice = data.choices?.[0];
  if (!choice) {
    throw new Error("API 返回数据异常：无 choices");
  }

  return {
    finish_reason: choice.finish_reason ?? "stop",
    content: choice.message?.content ?? undefined,
    reasoning_content: choice.message?.reasoning_content ?? undefined,
    tool_calls: choice.message?.tool_calls ?? undefined,
  };
}

export async function callOpenAIStream(
  request: ApiRequest,
  onChunk: (chunk: StreamChunk) => void,
  signal?: AbortSignal
): Promise<ApiResponse> {
  if (!API_KEY) {
    throw new Error(
      "未配置 OpenAI API Key。请在项目根目录创建 .env 文件并设置 VITE_OPENAI_API_KEY=sk-xxx"
    );
  }

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: request.model || MODEL,
      messages: request.messages,
      tools: request.tools,
      tool_choice: "auto",
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "未知错误");
    if (response.status === 429) {
      throw new Error("API Rate Limit 已达到，请稍后重试。");
    }
    if (response.status === 401) {
      throw new Error("API Key 无效，请检查 VITE_OPENAI_API_KEY 配置。");
    }
    throw new Error(`OpenAI API 错误 (${response.status}): ${errorBody}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("浏览器不支持 ReadableStream");
  }

  const decoder = new TextDecoder();
  let accumulatedContent = "";
  let accumulatedReasoning = "";
  let finishReason: string | null = null;
  const toolCallMap = new Map<number, AccumulatedToolCall>();

  let buffer = "";
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    done = streamDone;

    if (value) {
      buffer += decoder.decode(value, { stream: !done });
    }

    // Process complete lines in buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;

      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") {
        done = true;
        break;
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(dataStr);
      } catch {
        continue;
      }

      const choices = parsed.choices as Array<Record<string, unknown>> | undefined;
      if (!choices || choices.length === 0) continue;

      const delta = choices[0].delta as Record<string, unknown> | undefined;
      if (!delta) {
        // Check finish_reason even without delta
        if (choices[0].finish_reason) {
          finishReason = choices[0].finish_reason as string;
        }
        continue;
      }

      const deltaContent = (delta.content as string) ?? "";
      const deltaReasoning = (delta.reasoning_content as string) ?? "";

      if (deltaContent) accumulatedContent += deltaContent;
      if (deltaReasoning) accumulatedReasoning += deltaReasoning;

      // Handle streaming tool calls
      const deltaToolCalls = delta.tool_calls as Array<Record<string, unknown>> | undefined;
      if (deltaToolCalls) {
        for (const dtc of deltaToolCalls) {
          const idx = dtc.index as number;
          if (!toolCallMap.has(idx)) {
            toolCallMap.set(idx, {
              index: idx,
              id: dtc.id as string | undefined,
              function: {
                name: (dtc.function as Record<string, unknown> | undefined)?.name as string | undefined,
                arguments: "",
              },
            });
          }
          const existing = toolCallMap.get(idx)!;
          if (dtc.id) existing.id = dtc.id as string;
          const dtcFn = dtc.function as Record<string, unknown> | undefined;
          if (dtcFn?.name) existing.function.name = dtcFn.name as string;
          if (dtcFn?.arguments) existing.function.arguments += dtcFn.arguments as string;
        }
      }

      if (choices[0].finish_reason) {
        finishReason = choices[0].finish_reason as string;
      }

      onChunk({
        content: accumulatedContent,
        reasoning_content: accumulatedReasoning,
        deltaContent,
        deltaReasoning,
        finish_reason: finishReason,
        toolCalls: Array.from(toolCallMap.values()),
      });
    }
  }

  // Build final tool_calls from accumulated map
  const finalToolCalls =
    toolCallMap.size > 0
      ? Array.from(toolCallMap.values()).map((tc) => ({
          id: tc.id ?? "",
          type: "function" as const,
          function: {
            name: tc.function.name ?? "",
            arguments: tc.function.arguments,
          },
        }))
      : undefined;

  const finalFinishReason = finishReason ?? "stop";

  return {
    finish_reason: finalFinishReason as ApiResponse["finish_reason"],
    content: accumulatedContent || undefined,
    reasoning_content: accumulatedReasoning || undefined,
    tool_calls: finalToolCalls,
  };
}

export function formatMessagesForRequest(
  messages: { role: string; content: string; tool_calls?: unknown[]; tool_call_id?: string }[]
): ApiRequest["messages"] {
  return messages.map((m) => {
    const msg: ApiRequest["messages"][number] = {
      role: m.role,
      content: m.content,
    };
    return msg;
  });
}

export function buildToolMessage(
  toolCallId: string,
  result: Record<string, unknown>
): { role: string; content: string; tool_call_id: string } {
  return {
    role: "tool",
    tool_call_id: toolCallId,
    content: JSON.stringify(result),
  };
}

export function buildAssistantToolCallMessage(
  content: string | null,
  toolCalls: ApiResponse["tool_calls"],
  reasoningContent?: string | null
): { role: string; content: string; tool_calls: typeof toolCalls; reasoning_content?: string } {
  const msg: { role: string; content: string; tool_calls: typeof toolCalls; reasoning_content?: string } = {
    role: "assistant",
    content: content ?? "",
    tool_calls: toolCalls,
  };
  if (reasoningContent) {
    msg.reasoning_content = reasoningContent;
  }
  return msg;
}
