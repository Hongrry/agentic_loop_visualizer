# Agentic Loop Visualizer - MVP 产品需求文档（PRD）

# 1. 项目概述

## 项目名称

Agentic Loop Visualizer

---

## 项目定位

Agentic Loop Visualizer 是一个用于教学与演示 AI Agent Runtime 的可视化系统。

该系统用于动态展示 Agentic Loop / ReAct Loop 的完整运行过程，帮助学习者真正理解：

- Agent 如何思考（Think）
- 为什么调用工具（Act）
- Tool Result 如何进入上下文（Observe）
- 为什么继续循环
- Agent 如何最终生成答案

本项目不是：

❌ 静态流程图

而是：

# Agent Runtime Replay System（Agent运行时回放系统）

---

# 2. 项目目标

当前大多数 Agent 教程只能让用户理解：

```text
Think → Act → Observe
```

但无法理解：

- Runtime 实际发生了什么
- 状态如何流转
- Tool Result 如何注入上下文
- Agent 为什么继续循环
- Agent 如何做决策

本项目的目标：

# 让用户“看见 Agent 在运行”

通过动态 Runtime 可视化，让学习者理解 Agentic Loop 的核心思想。

---

# 3. MVP 范围

## MVP 包含内容

第一版仅实现：

- 单 Agent
- 顺序 ReAct Loop
- 接入真实 OpenAI API（支持 function calling / tool use）
- 真实 Runtime 运行（非 Mock）
- Runtime Playback（运行时回放）
- 状态流转可视化
- Context Evolution（上下文演化）
- Timeline 时间线
- 动态 Loop 动画

---

## MVP 不包含内容

第一版不实现：

- 多 Agent
- 并行执行
- DAG Runtime
- LangGraph
- WebSocket Streaming
- 后端服务
- 数据库存储
- 用户系统

MVP 即接入真实 OpenAI API，不走本地 Mock。

---

# 4. 核心 Runtime 模型

系统需要可视化如下运行循环：

```text
Think
↓
Act
↓
Observe
↓
Think
↓
...
↓
End
```

每一步都必须展示：

- 当前阶段
- 当前思考内容
- Tool 调用
- Tool 返回结果
- Context 更新
- 为什么进入下一步

---

# 5. 用户体验目标

用户打开系统后，应该有一种：

# “正在观看 Agent 实时思考”

的感觉。

系统必须动态展示：

- Runtime 状态变化
- Agent 的推理过程
- Tool 调用过程
- Context 演化
- Loop 流转

整个系统应该是：

- 动态的
- 可回放的
- 有状态变化的
- 有动画的

而不是静态页面。

---

# 6. 技术栈

## 前端框架

必须使用：

- React
- TypeScript
- Vite

---

## UI

- TailwindCSS
- shadcn/ui

---

## 可视化

- React Flow

用于构建 Loop Runtime Graph。

---

## 动画

- Framer Motion

用于：

- 节点激活动画
- 状态切换动画
- 流转动画
- Context 注入动画

---

## 状态管理

- Zustand

---

## Icons

- lucide-react

---

# 7. 页面布局

页面采用：

# 三栏布局 + 底部 Timeline

---

# 左侧：Loop Runtime Graph

## 功能

展示 Agent Loop Runtime 状态机。

---

## 节点

包含：

```text
Think
Act
Observe
End
```

---

## 节点状态

每个节点支持：

- idle
- active
- completed

---

## 当前节点效果

当前运行节点需要：

- glow（发光）
- pulse（脉冲）
- scale up（轻微放大）
- 平滑动画切换

---

## 边动画

节点之间的连接线需要：

- 流动动画
- 表现 Runtime 正在流转

---

## Loop 表现

需要动态表现：

```text
Think → Act → Observe → Think
```

形成持续循环感。

---

# 中间：Step Detail Panel

## 功能

展示当前 Runtime Step 的详细信息。

不同 Phase 展示不同 UI。

---

# Think 阶段

需要展示：

- 当前 Goal
- 当前 Decision
- 当前 Thought（推理内容）

示例：

```json
{
  "goal": "获取天气信息",
  "decision": "调用 weather_api",
  "thought": "用户需要实时天气，因此需要调用工具。"
}
```

---

# Act 阶段

需要展示：

- Tool Name
- Tool Parameters
- Tool 执行状态
- Loading 动画

示例：

```json
{
  "tool": "weather_api",
  "input": {
    "city": "Beijing"
  }
}
```

---

# Observe 阶段

需要展示：

- Tool Result
- Context Injection
- Memory 更新

示例：

```json
{
  "temperature": 22,
  "condition": "rain"
}
```

---

# End 阶段

需要展示：

- Final Answer
- 执行总结

---

# 右侧：Context Evolution Panel

## 功能

展示 Context 如何随着 Runtime 演化。

这是整个教学系统中最重要的部分之一。

---

## 必须展示

- Context Before
- 新增 Context
- Context After

---

## 动画要求

新增内容必须：

- 动态出现
- 高亮
- 类似 diff 风格

示例：

```diff
+ weather result added
+ temperature: 22
+ condition: rain
```

---

# 底部：Timeline Player

## 功能

展示整个 Runtime 的执行时间线。

---

## 示例

```text
[1] Think
[2] Act
[3] Observe
[4] Think
[5] End
```

---

## 功能要求

支持：

- Play
- Pause
- Next Step
- Previous Step
- Replay

---

## Timeline 行为

- 当前 Step 高亮
- 已完成 Step 标记
- 平滑切换动画
- 支持点击回放

---

# 8. Runtime 状态结构

使用 Zustand 管理 Runtime 状态。

---

## TypeScript 类型定义

```ts
type LoopPhase =
  | "think"
  | "act"
  | "observe"
  | "end";

type ApiRequest = {
  model: string;
  messages: { role: string; content: string }[];
  tools?: ToolDefinition[];
};

type ApiResponse = {
  finish_reason: "stop" | "tool_calls" | "length";
  content?: string;
  tool_calls?: ToolCall[];
};

type ToolCall = {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
};

type LoopStep = {
  id: string;

  phase: LoopPhase;

  title: string;

  thought?: string;

  goal?: string;

  decision?: string;

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

type RuntimeStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "error";

type RuntimeState = {
  steps: LoopStep[];

  currentStepIndex: number;

  status: RuntimeStatus;

  playing: boolean;

  speed: number;

  error: string | null;

  setUserInput: (input: string) => void;

  startLoop: () => Promise<void>;

  nextStep: () => void;

  previousStep: () => void;

  play: () => void;

  pause: () => void;

  replay: () => void;

  reset: () => void;
};
```

---

# 9. OpenAI API 接入

MVP 直接接入 OpenAI Chat Completions API，使用 function calling 实现真实的 Agentic Loop。

---

## API 配置

前端通过环境变量配置：

```env
VITE_OPENAI_API_KEY=sk-xxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o
```

支持兼容 OpenAI 协议的服务（如 Azure OpenAI、Ollama 等），通过 `VITE_OPENAI_BASE_URL` 切换。

---

## Tool 定义

系统预定义一组 Tool 供 Agent 调用：

```ts
const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "获取指定城市的实时天气信息",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "城市名称" }
        },
        required: ["city"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "搜索互联网获取最新信息",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "搜索关键词" }
        },
        required: ["query"]
      }
    }
  }
];
```

---

## Agentic Loop 执行流程

真实的 ReAct Loop 流程：

```text
用户输入
  ↓
[Think] 调用 OpenAI API（带 tools 定义）
  ↓
API 返回：
  - finish_reason=stop → [End] 直接输出答案
  - finish_reason=tool_calls → [Act] 执行 tool call
  ↓
[Act] 前端执行 Tool（调用真实 API 或本地模拟 Tool 实现）
  ↓
[Observe] Tool 结果注入 messages 上下文
  ↓
[Think] 再次调用 OpenAI API（携带 tool result）
  ↓
循环直到 finish_reason=stop
  ↓
[End] 展示最终答案
```

---

## Runtime 数据示例（真实 API 交互）

用户输入："帮我查询北京天气并给出穿衣建议"

Step 1 - Think：
```ts
{
  id: "step-1",
  phase: "think",
  title: "Agent 分析用户意图",
  thought: "用户需要北京的天气信息来给出穿衣建议，需要调用 get_weather 工具。",
  apiRequest: {
    model: "gpt-4o",
    messages: [
      { role: "user", content: "帮我查询北京天气并给出穿衣建议" }
    ],
    tools: [...]
  },
  apiResponse: {
    finish_reason: "tool_calls",
    tool_calls: [{
      function: { name: "get_weather", arguments: '{"city":"北京"}' }
    }]
  },
  contextAfter: ["用户请求天气+穿衣建议", "Agent 决定调用 get_weather"]
}
```

Step 2 - Act：
```ts
{
  id: "step-2",
  phase: "act",
  title: "执行 Tool 调用",
  toolName: "get_weather",
  toolInput: { city: "北京" },
  toolOutput: { temperature: 22, condition: "晴", humidity: "45%" }
}
```

Step 3 - Observe：
```ts
{
  id: "step-3",
  phase: "observe",
  title: "Tool 结果注入上下文",
  contextBefore: ["用户请求天气+穿衣建议"],
  newContext: [
    "北京天气：22°C，晴，湿度 45%"
  ],
  contextAfter: [
    "用户请求天气+穿衣建议",
    "北京天气：22°C，晴，湿度 45%"
  ]
}
```

Step 4 - Think（第二轮）：
```ts
{
  id: "step-4",
  phase: "think",
  title: "Agent 生成最终回答",
  thought: "已获取天气数据，现在可以给出穿衣建议。",
  apiRequest: {
    messages: [
      { role: "user", content: "帮我查询北京天气并给出穿衣建议" },
      { role: "assistant", tool_calls: [...] },
      { role: "tool", content: "北京：22°C，晴，湿度 45%" }
    ]
  },
  apiResponse: {
    finish_reason: "stop",
    content: "北京当前22°C，晴天，建议穿薄外套或长袖..."
  }
}
```

Step 5 - End：
```ts
{
  id: "step-5",
  phase: "end",
  title: "输出最终答案",
  finalAnswer: "北京当前22°C，晴天，建议穿薄外套或长袖..."
}
```

---

# 10. 动画要求

动画是整个系统的重要组成部分。

必须让系统有：

# “Agent 正在运行”

的感觉。

---

# 必须实现的动画

## 1. 节点激活动画

当前节点：

- 放大
- 发光
- 脉冲
- 平滑过渡

---

## 2. Edge Flow 动画

连接线持续流动。

表现 Runtime 正在流转。

---

## 3. Timeline Playback 动画

Step 切换时：

- 平滑过渡
- Timeline 自动推进

---

## 4. Tool Loading 动画

Act 阶段：

```text
Calling weather_api...
```

需要：

- loading
- spinner
- 执行中状态

---

## 5. Context Injection 动画

Observe 阶段：

新增 Context 动态插入。

---

# 11. UI 风格

## 整体风格

# 深色科技 Runtime 风格

参考：

- Claude Code
- LangSmith
- OpenAI Tracing UI
- AI Runtime Dashboard

---

## UI 关键词

- 深色背景
- glassmorphism
- glow
- gradient
- smooth motion
- developer style

---

# 12. 组件结构

```text
src/
├── components/
│   ├── loop/
│   │   ├── LoopGraph
│   │   ├── PhaseNode
│   │   ├── AnimatedEdge
│   │
│   ├── panels/
│   │   ├── StepDetailPanel
│   │   ├── ContextPanel
│   │
│   ├── timeline/
│   │   ├── TimelinePlayer
│   │
│   ├── input/
│   │   ├── UserInput
│
├── store/
│   ├── runtimeStore
│
├── api/
│   ├── openai        # OpenAI API 调用封装
│   ├── tools         # Tool 定义与执行
│   ├── agentLoop     # Agentic Loop 核心引擎
│
├── types/
│   ├── runtime
```

---

# 13. 开发要求

## 代码要求

- TypeScript strict mode
- 禁止使用 any
- 组件化
- Clean Architecture
- 可维护代码结构
- API Error 处理（网络异常、超时、Rate Limit）
- Loading 状态管理

---

## React 要求

- 使用 Functional Component
- 使用 Hooks
- Zustand 管理状态
- 响应式布局

---

## 样式要求

- 使用 TailwindCSS
- 尽量使用 shadcn/ui
- 避免 inline style

---

## API 要求

- 使用 fetch 调用 OpenAI API（兼容协议）
- 支持通过环境变量配置 API Key / Base URL / Model
- API Key 仅在前端使用，不经过后端

---

# 14. 开发阶段规划

# Phase 1（MVP）

必须完成：

- 基础布局
- Loop Graph
- Timeline
- OpenAI API 接入（function calling）
- 真实 Agentic Loop 引擎
- Tool 定义与执行
- Step 切换
- 节点动画
- Context Panel
- 用户输入

---

# Phase 2

可选增强：

- 自动播放
- Speed Control
- 更丰富动画
- Context Diff 优化
- Timeline Replay
- 更多 Tool 接入
- 流式响应（Streaming）

---

# Phase 3（未来扩展）

未来可能扩展：

- MCP
- LangGraph
- Multi-Agent
- Parallel T