import type { ApiRequest, ApiResponse, ToolDefinition } from "@/types/runtime";

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

export async function callOpenAI(request: ApiRequest): Promise<ApiResponse> {
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
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
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
