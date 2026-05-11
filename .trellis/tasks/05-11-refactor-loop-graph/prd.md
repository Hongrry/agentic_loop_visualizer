# brainstorm: 重构运行时图谱为直观的循环布局

## Goal

将当前线性垂直布局的运行时图谱重构为环形布局，让用户一眼看出 Agentic Loop 的迭代循环特性。

## Requirements

* think/act/observe 三个节点围成环形（三角圆环），在左侧栏 240px 内实现
* end 节点在环的右侧，作为循环出口
* 所有边使用曲线（Bezier），增强环形感
* 保留 Think→End 直连路径（无工具调用时直接结束）
* 保持现有动画效果（活动节点脉冲、边颜色/透明度过渡）
* 保持与 phaseConfig / runtimeStore 的兼容

## Acceptance Criteria

* [ ] think/act/observe 呈现明显的三角环形布局
* [ ] end 节点在环右侧
* [ ] 所有边使用曲线路由，observe→think 回边弧形突出循环
* [ ] think→end 路径在无工具调用场景下正确显示
* [ ] 活动/完成/空闲三种节点状态正确显示
* [ ] 流式执行时动画正确响应

## Decision (ADR-lite)

**布局**: think/act/observe 三角环形，end 在环右侧
**边路由**: 全部使用 Bezier/smoothstep 曲线，`type: "smoothstep"` 或自定义 SVG 路径
**节点尺寸**: 保持现有 px-5 py-3 min-w-[110px]，若拥挤则微调缩小
**侧边栏**: 保持 240px 不变

## Out of Scope

* 不改变节点内部结构和 phaseConfig
* 不改变 store 逻辑
* 不增加迭代轮次显示

## Technical Notes

* LoopGraph.tsx — 核心改动：节点 position 计算、边路径生成
* AnimatedEdge.tsx — 需要支持曲线边（getBezierPath 或 getSmoothStepPath）
* PhaseNode.tsx — 可能微调尺寸
* ReactFlow 的 `getBezierPath` / `getSmoothStepPath` 来自 @xyflow/react
