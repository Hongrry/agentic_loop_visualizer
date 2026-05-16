export type LoopPhase = "think" | "act" | "observe" | "end";

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string }>;
      required: string[];
    };
  };
};

export type ApiRequest = {
  model: string;
  messages: { role: string; content: string; tool_calls?: ToolCallResult[]; tool_call_id?: string }[];
  tools?: ToolDefinition[];
};

export type ApiResponse = {
  finish_reason: "stop" | "tool_calls" | "length";
  content?: string;
  reasoning_content?: string;
  tool_calls?: ToolCall[];
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ToolCallResult = ToolCall;

export type LoopStep = {
  id: string;
  phase: LoopPhase;
  title: string;
  thought?: string;
  goal?: string;
  decision?: string;
  decisionReason?: string;
  transitionLabel?: string;
  loopRound?: number;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  contextBefore: string[];
  contextAfter: string[];
  newContext?: string[];
  apiRequest?: ApiRequest;
  apiResponse?: ApiResponse;
  finalAnswer?: string;
  duration?: number;
};

export type RuntimeStatus = "idle" | "running" | "paused" | "completed" | "error";

export type StreamChunk = {
  content: string;
  reasoning_content: string;
  deltaContent: string;
  deltaReasoning: string;
  finish_reason: string | null;
  toolCalls: AccumulatedToolCall[];
};

export type AccumulatedToolCall = {
  index: number;
  id?: string;
  function: {
    name?: string;
    arguments: string;
  };
};

export type RuntimeErrorCode = "auth_error" | "rate_limit" | "network_timeout" | "abort" | "api_error" | "unknown";

export type RuntimeError = {
  code: RuntimeErrorCode;
  message: string;
  retryable: boolean;
};
