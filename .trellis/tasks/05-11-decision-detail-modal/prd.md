# 决策链路详情抽屉面板

## 目标

当前 DecisionTrail 点击行只能展开/收起显示基本摘要。用户需要点击某一轮后弹出抽屉面板，展示完整的决策细节：可用工具有哪些、模型为什么选择特定工具、大模型原始返回结果等。

## 需求

1. 点击 DecisionTrail 行 → 从右侧滑入抽屉面板，约占 50% 宽度
2. 抽屉内纵向滚动展示 8 个详情区块
3. 抽屉顶部有轮次导航（← 上一轮 / 第N轮 / 下一轮 →）
4. 去掉 DecisionTrail 的展开/收起逻辑，行点击改为触发抽屉
5. 数据来源全部使用已有的 apiRequest/apiResponse，不新增数据层字段

## 已确认决策

| # | 决策点 | 选择 |
|---|--------|------|
| 1 | 布局 | 纵向滚动，从上到下依次展示 |
| 2 | 选择理由来源 | 直接用 reasoning_content，不改数据层 |
| 3 | 触发方式 | 点击行直接打开抽屉，去掉展开/收起 |
| 4 | 弹窗形式 | 右侧抽屉式面板，~50% 宽度，framer-motion 滑入动画 |
| 5 | 轮次导航 | 顶部 ← 上一轮 / 第N轮 / 下一轮 → |
| 6 | 内容区块 | 8 个区块（见下方） |

## 抽屉内容结构（纵向滚动）

1. **本轮目标** — thinkStep.goal
2. **模型推理过程** — apiResponse.reasoning_content（体现工具选择理由）
3. **可用工具列表** — apiRequest.tools 全部工具卡片，被选中工具高亮
4. **模型决策** — decision + decisionReason + finish_reason
5. **工具执行结果** — toolName + 输入参数 + 输出结果
6. **大模型原始返回** — apiResponse 完整 JSON（content、tool_calls、finish_reason）
7. **上下文变化** — 更新前 → 新增 → 更新后
8. **耗时**

## 验收标准

- [ ] 点击 DecisionTrail 行 → 右侧抽屉滑入
- [ ] 抽屉宽度 ~50% 视口，毛玻璃背景 + 遮罩层
- [ ] 顶部轮次导航可用，切换时内容更新
- [ ] 8 个区块按顺序展示，无 reasoning_content 时显示"无推理内容"
- [ ] 无 tool_calls 时（直接回答），跳过"工具执行结果"区块
- [ ] apiRequest.tools 为空时，跳过"可用工具列表"区块
- [ ] 原始 JSON 区域使用 `<pre>` 格式化展示
- [ ] 关闭抽屉：点击遮罩 / 按 Esc / 点击右上角关闭按钮
- [ ] TypeScript 编译 + 生产构建通过

## 技术方案

### 组件变更

| 文件 | 变更 |
|------|------|
| `DecisionTrail.tsx` | 去掉展开/收起逻辑和 expandedRounds 状态；新增 selectedRound 状态；行点击 → setSelectedRound；引入 DecisionDetailDrawer |
| `DecisionDetailDrawer.tsx` | **新组件**，右侧抽屉面板 |

### 不变的文件
- `runtime.ts`、`agentLoop.ts`、`tools.ts` — 数据层不动
- `LoopGraph.tsx`、`StepDetailPanel.tsx`、`TimelinePlayer.tsx`、`UserInput.tsx` — 不动
- UI 组件 — 不动

### 抽屉组件结构
```
DecisionDetailDrawer
├── 遮罩层 (bg-black/40 backdrop-blur-sm, onClick → close)
├── 抽屉主体 (w-[50vw], h-full, right-0, bg-surface-800/90 backdrop-blur-xl)
│   ├── 头部 (关闭按钮 + "第N轮决策详情" + ← → 导航)
│   └── 内容区 (overflow-y-auto, 8个区块)
│       ├── 区块1: 本轮目标
│       ├── 区块2: 模型推理过程
│       ├── 区块3: 可用工具列表
│       ├── 区块4: 模型决策
│       ├── 区块5: 工具执行结果 (条件渲染)
│       ├── 区块6: 大模型原始返回
│       ├── 区块7: 上下文变化
│       └── 区块8: 耗时
```

## 不做的事情

- 不在数据层新增字段
- 不改动 DecisionTrail 以外的现有组件
- 不支持导出/分享
- 不支持多轮对比视图

## 技术笔记

- 框架：React + TypeScript + Tailwind CSS + Framer Motion + Zustand
- 相关文件：`DecisionTrail.tsx`、`runtime.ts`、`tools.ts`、`agentLoop.ts`
- 抽屉动画：framer-motion `animate={{ x: 0 }}` / `exit={{ x: "100%" }}`
- Esc 关闭：useEffect + keydown listener
