# 可视化体现循环决策原因

## 目标

当前可视化展示了 Agent 循环的四个阶段（思考→执行→观察→结束），但没有清晰传达每一步的**决策原因**。用户需要看到推理链路：为什么调用工具、为什么继续循环、为什么可以结束。

## 需求

1. 数据层新增 3 个字段：`decisionReason`(决策原因)、`transitionLabel`(边标签)、`loopRound`(循环轮次)，在 agentLoop.ts 中自动填充
2. 右侧面板从"上下文演化"改为"决策链路"，紧凑型 — 每轮一行，可展开查看详情
3. LoopGraph 所有边上加过渡标签（如"调用工具获取数据"/"直接输出答案"）
4. 上下文演化内容融入决策链路的展开区域
5. Timeline hover 保持简洁，不加 tooltip

## 已确认决策

| # | 决策点 | 选择 |
|---|--------|------|
| 1 | 范围 | 数据+视觉一起改 |
| 2 | 布局 | 替换右侧面板为决策链路 |
| 3 | 粒度 | 紧凑型，每轮一行可展开 |
| 4 | 图谱边 | 加过渡标签 |
| 5 | 数据字段 | decisionReason + transitionLabel + loopRound |
| 6 | Timeline hover | 不加 tooltip |

## 验收标准

- [ ] LoopGraph 边上显示过渡原因标签（think→act/end、act→observe、observe→think）
- [ ] 右侧决策链路面板展示每轮循环的决策结论（一行），点击展开看详情
- [ ] 展开详情包含：决策原因、工具调用摘要、上下文变化
- [ ] 边界情况：无 reasoning_content 时用 decision 兜底
- [ ] 边界情况：MAX_LOOPS 强制终止显示"达到最大循环次数(8轮)"
- [ ] 边界情况：API 报错时决策原因显示错误信息
- [ ] 图谱支持 think→end 分支路径（无工具调用时直接结束）
- [ ] 原有 ContextPanel 的上下文展示融入决策链路展开区
- [ ] TypeScript 编译 + 生产构建通过

## 技术方案

### 数据层 (`runtime.ts`)
```ts
// LoopStep 新增字段
decisionReason?: string;   // 决策原因
transitionLabel?: string;   // 边标签文本
loopRound?: number;         // 循环轮次(从1开始)
```

### 数据填充 (`agentLoop.ts`)
- think→act 时：decisionReason = "用户请求需要调用 {toolName} 获取数据"，transitionLabel = "调用工具: {toolName}"
- think→end 时：decisionReason = "模型判断信息充足，直接回答"，transitionLabel = "直接输出答案"
- observe→think(回环) 时：transitionLabel = "信息不足，继续分析"
- 错误时：decisionReason = 错误信息
- MAX_LOOPS 时：decisionReason = "达到最大循环次数(8轮)"

### 组件变更

| 文件 | 变更 |
|------|------|
| `runtime.ts` | 新增 3 个字段 |
| `agentLoop.ts` | 填充决策字段 |
| `ContextPanel.tsx` → `DecisionTrail.tsx` | 重写为决策链路面板 |
| `LoopGraph.tsx` | 边上加标签，支持 think→end 分支 |
| `App.tsx` | 引用新组件，调整布局 |

### 不变的文件
- `StepDetailPanel.tsx` - 保持现有结构
- `TimelinePlayer.tsx` - 不加 tooltip
- `UserInput.tsx` - 不变
- `PhaseNode.tsx` - 不变
- UI 组件 (button/card/badge/input) - 不变

## 不做的事情

- Timeline hover tooltip
- 决策链路导出/分享
- 多 Agent 可视化
- 中间 StepDetailPanel 结构改动

## 技术笔记

- 框架：React + TypeScript + Tailwind CSS + Framer Motion + Zustand + React Flow
- 相关文件：`agentLoop.ts`, `runtime.ts`, `LoopGraph.tsx`, `ContextPanel.tsx`, `App.tsx`
