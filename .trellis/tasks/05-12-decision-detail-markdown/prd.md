# brainstorm: DecisionDetailDrawer + StepDetailPanel Markdown支持

## Goal

为 DecisionDetailDrawer 和 StepDetailPanel 的 LLM 文本内容区域添加 Markdown 渲染，抽取共享 MarkdownContent 组件，提升推理过程、决策、目标等富文本的可读性。

## Requirements

* 创建共享 `<MarkdownContent>` 组件（react-markdown + rehype-highlight）
* DecisionDetailDrawer 区块1(本轮目标)、区块2(推理过程)、区块4(模型决策) 使用 Markdown 渲染
* StepDetailPanel 的 `goal`、`decision`、`thought` 字段使用 Markdown 渲染
* 代码块使用 highlight.js 语法高亮
* 区块5(工具执行结果)、区块6(原始返回) 保持 JSON `<pre>` 不变
* 空字符串 / null 显示占位文案

## Acceptance Criteria

* [ ] DecisionDetailDrawer 的目标、推理过程、决策文本以格式化 Markdown 展示
* [ ] StepDetailPanel 的 goal、decision、thought 以格式化 Markdown 展示
* [ ] 代码块有 highlight.js 语法高亮
* [ ] 列表、标题、加粗、斜体、链接正常渲染
* [ ] 工具输出的 JSON 区块不受影响
* [ ] 空值/null 无崩溃，显示合理占位
* [ ] TypeScript 编译无错误

## Definition of Done

* Lint / typecheck 通过
* 两个组件的 Markdown 区块在浏览器中正确渲染
* 抽取的 MarkdownContent 组件可复用

## Technical Approach

* 依赖: `react-markdown` + `rehype-highlight` + `highlight.js`
* 新建: `src/components/ui/MarkdownContent.tsx` 共享组件
* 修改: `src/components/panels/DecisionDetailDrawer.tsx`
* 修改: `src/components/panels/StepDetailPanel.tsx`

### MarkdownContent 组件设计

```tsx
// props: children (string), className?
// 内部: <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{children}</ReactMarkdown>
// 处理空值: children 为空时返回占位文案
```

### 影响的区块

**DecisionDetailDrawer**:
- 区块1 (line 109-111): `goal || decision` → `<MarkdownContent>`
- 区块2 (line 120-121): `reasoning_content` → `<MarkdownContent>`  
- 区块4 (line 176-189): `decision` / `decisionReason` → `<MarkdownContent>`

**StepDetailPanel**:
- `goal` (line 66-68)
- `decision` (line 74-77)
- `thought` (line 97-99)

## Decision (ADR-lite)

**Context**: 需要在 React 组件中渲染 LLM 输出的 Markdown 文本
**Decision**: 使用 react-markdown + rehype-highlight，抽共享 MarkdownContent 组件
**Consequences**: 增加约 60KB gzipped 依赖；react-markdown 默认安全(不渲染 raw HTML)

## Out of Scope

* 工具执行结果 / 原始返回区块 (保持 JSON pre)
* 上下文变化区块
* 其他面板/组件
* 自定义 Markdown 样式主题（使用 highlight.js 默认主题）

## Technical Notes

* 文件: `src/components/panels/DecisionDetailDrawer.tsx` (330行)
* 文件: `src/components/panels/StepDetailPanel.tsx`
* 类型: `src/types/runtime.ts` (LoopStep)
* 当前无 Markdown 依赖
