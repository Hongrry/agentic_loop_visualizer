# brainstorm: 重构全局布局 - 美观简洁

## Goal

整理当前三栏布局，统一各区域的视觉风格，去除冗余的边框和背景层，实现美观简洁的界面。

## What I already know

* 当前布局：顶部(标题+UserInput) / 中部三栏(决策链路|循环图谱|步骤详细) / 底部(Timeline)
* 决策链路和步骤详细用了 Card 包裹（bg/border/rounded），循环图谱是裸 div + 简易标题栏
* 存在多层嵌套背景（sidebar bg + card bg）和多余边框（layout border-r + card border + card header border-b）
* Card 组件：rounded-xl border border-white/10 bg-surface-800/60 backdrop-blur-xl
* CardHeader：px-5 py-3 border-b border-white/5
* 示例提示词 chips 在 idle/completed 时占据顶部空间

## Open Questions

* 各区域的视觉"框架"程度？（统一 Card / 统一扁平 / 混合）

## Requirements (evolving)

* 布局美观简洁
* 视觉风格统一

## Technical Notes

* App.tsx, DecisionTrail.tsx, StepDetailPanel.tsx, LoopGraph.tsx, card.tsx
* ContextPanel.tsx 目前未在 App.tsx 中使用
