# brainstorm: optimize UI spacing and visual consistency

## Goal

统一优化系统全局 UI 的间距体系，减少过大的 padding，建立一致的间距规范，让界面更加协调紧凑。

## What I already know

### 审计发现的问题

**1. 间距不统一**
- App header/footer: `px-6 py-4` (24px/16px)
- CardHeader: `px-6 py-4`, CardContent: `p-5` (水平方向 24px vs 20px 不一致)
- PhaseNode: `px-7 py-5` (28px/20px) — 全系统最大内边距
- Drawer header: `px-8 py-5` (32px/20px) — 水平 padding 很大
- Drawer content: `px-8 py-6` (32px/24px)
- DecisionTrail rows: `px-5 py-3` (20px/12px)
- Button default: `px-4 py-2` (16px/8px)
- Badge: `px-2.5 py-0.5`

**2. 内容块 padding 偏大**
- 大部分内容块使用 `p-5` (20px)，如 CardContent、Drawer 内区块
- 思考/决策/工具结果块使用 `p-4` (16px)
- 上下文条目使用 `p-3` (12px)

**3. 圆角不统一**
- `rounded-xl` (12px) 是主流
- Card 用 `rounded-2xl` (16px)
- PhaseNode 用 `rounded-3xl` (24px)

**4. 硬编码宽度**
- 左侧栏: `w-[280px]`
- 右侧栏: `w-[340px]`
- Drawer: `w-[50vw]`

**5. 其他不一致**
- `mt-1.5` vs `my-3` 垂直间距不统一
- PhaseNode 的 `gap-130` (节点间距) 可能过大
- 多处重复的 "p-5 + rounded-xl + border" 组合可抽取

### 受影响的文件
- `src/App.tsx` - 全局布局 header/footer/侧边栏
- `src/components/ui/card.tsx` - Card/CardHeader/CardContent
- `src/components/ui/button.tsx` - Button 尺寸
- `src/components/ui/badge.tsx` - Badge 内边距
- `src/components/ui/input.tsx` - Input 内边距
- `src/components/loop/PhaseNode.tsx` - 节点卡片
- `src/components/loop/LoopGraph.tsx` - 节点布局间距
- `src/components/panels/DecisionDetailDrawer.tsx` - 抽屉面板
- `src/components/panels/DecisionTrail.tsx` - 决策列表
- `src/components/panels/StepDetailPanel.tsx` - 步骤详情
- `src/components/panels/ContextPanel.tsx` - 上下文面板
- `src/components/timeline/TimelinePlayer.tsx` - 时间线
- `src/components/input/UserInput.tsx` - 用户输入

## Assumptions (temporary)

* 用户希望整体更紧凑，减少不必要的大 padding
* 用户希望建立一致的间距规范，而非逐个调整
* 用户对圆角统一没有特别偏好，但可以一并处理

## Decisions Made

### 间距规范
- 内容区块: 统一 `p-4` (16px)
- Header 区域: 统一 `px-5 py-3` (20px/12px)
- 小元素(Badge/标签): 保持 `px-2.5 py-0.5`

### 宽度调整
- 左侧栏: `w-[280px]` → `w-[240px]`
- 右侧栏: `w-[340px]` → `w-[300px]`
- Drawer: `w-[50vw]` → `w-[40vw]`

### 圆角规范
- 外层容器: `rounded-xl` (12px)
- 内部区块: `rounded-lg` (8px)
- Card `rounded-2xl` → `rounded-xl`
- PhaseNode `rounded-3xl` → `rounded-xl`

### 节点间距
- LoopGraph 节点垂直间距: 130 → 110

## Open Questions

(none - ready for final confirmation)

## Requirements (evolving)

* 统一全局 padding 规范
* 减少过大的间距
* 保持可读性和可点击性

## Acceptance Criteria (evolving)

* [ ] 所有面板的 padding 遵循统一规范
* [ ] 界面整体视觉协调一致

## Definition of Done (team quality bar)

* 所有受影响的组件间距统一
* 视觉上协调一致
* 不影响功能

## Out of Scope (explicit)

* 颜色/主题调整
* 字体大小变更
* 功能变更

## Technical Notes

* 完整审计报告见上文 "What I already know"
* 项目使用 Tailwind CSS v4 + `@theme` 自定义颜色
* `cn()` 工具函数: clsx + tailwind-merge
