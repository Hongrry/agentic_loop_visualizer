import { useEffect } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { RoundGroup } from "@/components/panels/DecisionTrail";
import { MarkdownContent } from "@/components/ui/MarkdownContent";

type DecisionDetailDrawerProps = {
  groups: RoundGroup[];
  selectedRound: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function DecisionDetailDrawer({
  groups,
  selectedRound,
  onClose,
  onPrev,
  onNext,
}: DecisionDetailDrawerProps) {
  const selectedGroup = groups.find((g) => g.round === selectedRound) ?? null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!selectedGroup) return null;

  const currentIndex = groups.findIndex((g) => g.round === selectedRound);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < groups.length - 1;

  const thinkStep = selectedGroup.thinkStep;
  const actStep = selectedGroup.actStep;
  const observeStep = selectedGroup.observeStep;
  const endStep = selectedGroup.endStep;

  const hasTools = thinkStep?.apiRequest?.tools && thinkStep.apiRequest.tools.length > 0;
  const hasToolCalls = selectedGroup.toolNames.length > 0;
  const hasReasoningContent = !!thinkStep?.apiResponse?.reasoning_content;

  return (
    <>
      {/* 遮罩层 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 抽屉主体 */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-[40vw] z-50 bg-surface-800/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl"
      >
        {/* 头部 */}
        <div className="shrink-0 px-5 py-3 border-b border-white/5 flex items-center gap-3">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={onPrev}
            className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="上一轮"
          >
            <ChevronLeft className="h-4 w-4 text-white/50" />
          </button>

          <h2 className="text-sm font-semibold text-white/80 tracking-tight">
            第{selectedRound}轮决策详情
          </h2>

          <button
            type="button"
            disabled={!hasNext}
            onClick={onNext}
            className="p-2 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="下一轮"
          >
            <ChevronRight className="h-4 w-4 text-white/50" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-2 rounded-lg hover:bg-white/5 transition-colors duration-200"
            aria-label="关闭"
          >
            <X className="h-4 w-4 text-white/40" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 区块1: 本轮目标 */}
          <div className="rounded-lg border border-white/5 bg-surface-900/30 p-4">
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
              本轮目标
            </span>
            <div className="mt-2">
              <MarkdownContent>
                {thinkStep?.goal || thinkStep?.decision || endStep?.decision || null}
              </MarkdownContent>
            </div>
          </div>

          {/* 区块2: 模型推理过程 */}
          <div className="rounded-lg border border-white/5 bg-surface-900/30 p-4">
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
              模型推理过程
            </span>
            {hasReasoningContent ? (
              <div className="mt-2 max-h-48 overflow-y-auto">
                <MarkdownContent>
                  {thinkStep!.apiResponse!.reasoning_content}
                </MarkdownContent>
              </div>
            ) : (
              <p className="text-xs text-white/30 mt-2">无推理内容</p>
            )}
          </div>

          {/* 区块3: 可用工具列表 (条件渲染) */}
          {hasTools && (
            <div className="rounded-lg border border-white/5 bg-surface-900/30 p-4">
              <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                可用工具列表
              </span>
              <div className="mt-2 grid gap-2">
                {thinkStep!.apiRequest!.tools!.map((tool) => {
                  const isSelected = actStep?.toolName === tool.function.name;
                  return (
                    <div
                      key={tool.function.name}
                      className={`rounded-lg p-3 border transition-colors duration-200 ${
                        isSelected
                          ? "border-glow-amber/30 bg-glow-amber/8"
                          : "border-white/5 bg-surface-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-mono font-semibold ${
                            isSelected ? "text-glow-amber" : "text-white/70"
                          }`}
                        >
                          {tool.function.name}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center rounded-full border border-glow-amber/20 bg-glow-amber/12 px-2 py-0.5 text-[10px] text-glow-amber">
                            已选择
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 mt-2 leading-relaxed">
                        {tool.function.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 区块4: 模型决策 */}
          <div className="rounded-lg border border-white/5 bg-surface-900/30 p-4">
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
              模型决策
            </span>
            <div className="mt-2 space-y-2.5">
              {(thinkStep?.decision || endStep?.decision) && (
                <div>
                  <span className="text-[10px] text-white/20">决策</span>
                  <div className="mt-1">
                    <MarkdownContent>
                      {thinkStep?.decision ?? endStep?.decision ?? null}
                    </MarkdownContent>
                  </div>
                </div>
              )}
              {selectedGroup.decisionReason && (
                <div>
                  <span className="text-[10px] text-white/20">决策原因</span>
                  <div className="mt-1">
                    <MarkdownContent>
                      {selectedGroup.decisionReason}
                    </MarkdownContent>
                  </div>
                </div>
              )}
              {thinkStep?.apiResponse?.finish_reason && (
                <div>
                  <span className="text-[10px] text-white/20">完成原因</span>
                  <span className="text-sm text-white/50 font-mono mt-1 block">
                    {thinkStep.apiResponse.finish_reason}
                  </span>
                </div>
              )}
              {!thinkStep?.decision && !endStep?.decision && !selectedGroup.decisionReason && !thinkStep?.apiResponse?.finish_reason && (
                <p className="text-xs text-white/30">无决策数据</p>
              )}
            </div>
          </div>

          {/* 区块5: 工具执行结果 (条件渲染) */}
          {hasToolCalls && (
            <div className="rounded-lg border border-white/5 bg-surface-900/30 p-4">
              <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                工具执行结果
              </span>
              <div className="mt-2 space-y-3">
                <div>
                  <span className="text-[10px] text-white/20">执行工具</span>
                  <span className="text-sm text-glow-amber font-mono ml-2">
                    {actStep?.toolName ?? selectedGroup.toolNames[0] ?? "未知"}
                  </span>
                </div>
                {actStep?.toolInput && (
                  <div>
                    <span className="text-[10px] text-white/20">输入参数</span>
                    <pre className="mt-2 p-3 rounded-lg bg-surface-900/50 border border-white/5 text-xs text-white/50 font-mono whitespace-pre-wrap leading-relaxed">
                      {JSON.stringify(actStep.toolInput, null, 2)}
                    </pre>
                  </div>
                )}
                {actStep?.toolOutput && (
                  <div>
                    <span className="text-[10px] text-white/20">输出结果</span>
                    <pre className="mt-2 p-3 rounded-lg bg-surface-900/50 border border-white/5 text-xs text-white/50 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {actStep.toolOutput.error
                        ? `错误: ${actStep.toolOutput.error}`
                        : JSON.stringify(actStep.toolOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 区块6: 大模型原始返回 */}
          <div className="rounded-lg border border-white/5 bg-surface-900/30 p-4">
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
              大模型原始返回
            </span>
            {thinkStep?.apiResponse ? (
              <pre className="mt-2 p-3 rounded-lg bg-surface-900/50 border border-white/5 text-xs text-white/50 font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {JSON.stringify(
                  {
                    content: thinkStep.apiResponse.content,
                    tool_calls: thinkStep.apiResponse.tool_calls,
                    finish_reason: thinkStep.apiResponse.finish_reason,
                  },
                  null,
                  2
                )}
              </pre>
            ) : (
              <p className="text-xs text-white/30 mt-2">无法获取响应数据</p>
            )}
          </div>

          {/* 区块7: 上下文变化 */}
          <div className="rounded-lg border border-white/5 bg-surface-900/30 p-4">
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
              上下文变化
            </span>
            <div className="mt-2 space-y-2">
              {(observeStep || thinkStep) && (
                <>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/20">
                      更新前: {observeStep?.contextBefore.length ?? thinkStep?.contextBefore.length ?? 0} 项
                    </span>
                    <span className="text-[10px] text-glow-green/60">
                      +{selectedGroup.newContextCount} 条新增
                    </span>
                    <span className="text-[10px] text-white/20">
                      更新后: {observeStep?.contextAfter.length ?? thinkStep?.contextAfter.length ?? 0} 项
                    </span>
                  </div>
                  {selectedGroup.newContextCount > 0 && (
                    <div>
                      <span className="text-[10px] text-white/20">新增内容</span>
                      <div className="mt-2 space-y-2">
                        {(observeStep?.newContext ?? thinkStep?.newContext ?? [])
                          .slice(0, 5)
                          .map((item, i) => (
                            <pre
                              key={i}
                              className="p-3 rounded-lg bg-surface-900/50 border border-white/5 text-[11px] text-white/50 font-mono truncate"
                            >
                              {item}
                            </pre>
                          ))}
                        {(observeStep?.newContext ?? thinkStep?.newContext ?? []).length > 5 && (
                          <span className="text-[10px] text-white/20">
                            还有{" "}
                            {(observeStep?.newContext ?? thinkStep?.newContext ?? []).length - 5}{" "}
                            项...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              {!observeStep && !thinkStep && (
                <p className="text-xs text-white/30">无上下文数据</p>
              )}
            </div>
          </div>

          {/* 区块8: 耗时 */}
          <div className="rounded-lg border border-white/5 bg-surface-900/30 p-4">
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
              耗时
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-white/20" />
              <span className="text-sm text-white/50 font-mono">
                {(selectedGroup.totalDuration / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
