import type { ToolDefinition, ToolCall } from "@/types/runtime";

type ResolvedTools = Record<string, (input: Record<string, unknown>) => Promise<Record<string, unknown>>>;

const toolHandlers: ResolvedTools = {
  get_weather: async (input: Record<string, unknown>) => {
    const city = (input.city as string) || "Unknown";
    await new Promise((r) => setTimeout(r, 600));
    const conditions = ["晴", "多云", "阴", "小雨", "大雨", "雷阵雨"];
    const temps = [15, 18, 20, 22, 25, 28, 30, 32, 35];
    return {
      city,
      temperature: temps[Math.floor(Math.random() * temps.length)],
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: `${30 + Math.floor(Math.random() * 50)}%`,
      wind: `${Math.floor(Math.random() * 20)}km/h`,
      updated: new Date().toISOString(),
    };
  },

  search_web: async (input: Record<string, unknown>) => {
    const query = (input.query as string) || "unknown";
    await new Promise((r) => setTimeout(r, 800));
    return {
      query,
      results: [
        {
          title: `搜索结果: ${query}`,
          snippet: `关于 "${query}" 的最新信息：根据多个来源的综合分析，${query} 是当前热门话题。`,
          url: `https://example.com/search?q=${encodeURIComponent(query)}`,
        },
        {
          title: `${query} - 百科`,
          snippet: `${query} 的相关定义和背景信息。了解更多详情请访问百科页面。`,
          url: `https://example.com/wiki/${encodeURIComponent(query)}`,
        },
      ],
      totalResults: 1230000,
      searchTime: "0.42s",
    };
  },
};

export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "获取指定城市的实时天气信息，包括温度、天气状况、湿度、风速等。",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "城市名称，如 '北京'、'上海'、'东京'" },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "搜索互联网获取最新信息、新闻或知识。",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词或问题" },
        },
        required: ["query"],
      },
    },
  },
];

export async function executeToolCall(toolCall: ToolCall): Promise<Record<string, unknown>> {
  const name = toolCall.function.name;
  const handler = toolHandlers[name];

  if (!handler) {
    throw new Error(`未知工具: ${name}`);
  }

  let args: Record<string, unknown>;
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch {
    args = {};
  }

  return handler(args);
}
