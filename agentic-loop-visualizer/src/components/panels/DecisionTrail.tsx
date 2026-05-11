import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, ChevronDown, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRuntimeStore } from "@/store/runtimeStore";
import { phaseConfig } from "@/components/loop/phaseConfig";
import type { LoopStep, LoopPhase } from "@/types/runtime";

const phaseIcons: Record<LoopPhase, React.ComponentType<{ className?: string }>> = {
  think: phaseConfig.think.icon,
  act: phaseConfig.act.icon,
  observe: phaseConfig.observe.icon,
  end: phaseConfig.end.icon,
};

function getTotalDuration(steps: LoopStep[]): number {
  return steps.reduce((sum, s) => sum + (s.duration ?? 0), 0);
}

type RoundGroup = {
  round: number;
  steps: LoopStep[];
  thinkStep?: LoopStep;
  actStep?: LoopStep;
  observeStep?: LoopStep;
  endStep?: LoopStep;
  decisionReason?: string;
  toolNames: string[];
  newContextCount: number;
  totalDuration: number;
};

function groupStepsByRound(steps: LoopStep[]): RoundGroup[] {
  const map = new Map<number, LoopStep[]>();
  let unroundIdx = 0;

  for (const step of steps) {
    const key = step.loopRound ?? --unroundIdx;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(step);
  }

  const groups: RoundGroup[] = [];
  const sortedKeys = [...map.keys()].sort((a, b) => a - b);

  for (const key of sortedKeys) {
    const roundSteps = map.get(key)!;
    const thinkStep = roundSteps.find((s) => s.phase === "think");
    const actStep = roundSteps.find((s) => s.phase === "act");
    const observeStep = roundSteps.find((s) => s.phase === "observe");
    const endStep = roundSteps.find((s) => s.phase === "end");

    const toolNames = roundSteps
      .filter((s) => s.phase === "act" && s.toolName)
      .map((s) => s.toolName!);

    const newContextCount = roundSteps.reduce(
      (sum, s) => sum + (s.newContext?.length ?? 0),
      0
    );

    groups.push({
      round: key > 0 ? key : key + Math.abs(unroundIdx) + 1,
      steps: roundSteps,
      thinkStep,
      actStep,
      observeStep,
      endStep,
      decisionReason: thinkStep?.decisionReason ?? endStep?.decisionReason,
      toolNames,
      newContextCount,
      totalDuration: getTotalDuration(roundSteps),
    });
  }

  return groups;
}

export function DecisionTrail() {
  const steps = useRuntimeStore((s) => s.steps);
  const status = useRuntimeStore((s) => s.status);

  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  const groups = useMemo(() => groupStepsByRound(steps), [steps]);

  const toggleRound = (round: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) {
        next.delete(round);
      } else {
        next.add(round);
      }
      return next;
    });
  };

  if (status === "idle") {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent-400" />
            <CardTitle>决策链路</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-white/30 text-center leading-relaxed">
            运行智能体后<br />在此查看每一步的决策原因
          </p>
        </CardContent>
      </Card>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-accent-400" />
            <CardTitle>决策链路</CardTitle>
            <Badge variant="default" className="ml-auto">
              0 轮
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-white/30 text-center">暂无决策数据</p>
        </CardContent>
      </Card>
    );
  }

  const PhaseIcon = ({ phase, className }: { phase: LoopPhase; className?: string }) => {
    const Icon = phaseIcons[phase];
    const cfg = phaseConfig[phase];
    return (
      <span style={{ color: cfg.color }} className={className}>
        <Icon className="h-full w-full" />
      </span>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent-400" />
          <CardTitle>决策链路</CardTitle>
          <Badge variant="default" className="ml-auto">
            {groups.length} 轮
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="space-y-px">
          <AnimatePresence>
            {groups.map((group, idx) => {
              const isExpanded = expandedRounds.has(group.round);
              const hasDecision = !!group.decisionReason;

              return (
                <motion.div
                  key={group.round}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3, ease: "easeOut" }}
                  className="border-b border-white/5 last:border-b-0"
                >
                  {/* Summary row */}
                  <button
                    type="button"
                    onClick={() => toggleRound(group.round)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-white/[0.02] transition-colors duration-200"
                  >
                    {/* Round badge */}
                    <span className="shrink-0 flex items-center justify-center w-12 h-6 rounded-full bg-white/10 text-xs font-semibold text-white/60">
                      第{group.round}轮
                    </span>

                    {/* Phase icon */}
                    <PhaseIcon
                      phase={group.thinkStep?.phase ?? group.steps[0]?.phase ?? "think"}
                      className="h-3.5 w-3.5 shrink-0"
                    />

                    {/* Decision summary */}
                    <span className="flex-1 text-xs text-white/70 truncate">
                      {hasDecision ? group.decisionReason : "推理中..."}
                    </span>

                    {/* Expand chevron */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="shrink-0"
                    >
                      <ChevronDown className="h-3.5 w-3.5 text-white/30" />
                    </motion.div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pl-[92px] space-y-2.5">
                          {/* 决策原因 */}
                          {group.decisionReason && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                                决策原因
                              </span>
                              <span className="text-xs text-white/60 leading-relaxed">
                                {group.decisionReason}
                              </span>
                            </div>
                          )}

                          {/* 执行工具 */}
                          {group.toolNames.length > 0 && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                                执行工具
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {group.toolNames.map((name) => (
                                  <span
                                    key={name}
                                    className="inline-flex items-center rounded-lg border border-glow-amber/15 bg-glow-amber/6 px-2 py-0.5 text-[11px] text-glow-amber font-mono"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                              {group.actStep?.toolOutput && (
                                <span className="text-[11px] text-white/35 font-mono leading-relaxed line-clamp-2">
                                  {(() => {
                                    const out = group.actStep.toolOutput;
                                    if (out.error) return `错误: ${out.error}`;
                                    return JSON.stringify(out).slice(0, 120);
                                  })()}
                                </span>
                              )}
                            </div>
                          )}

                          {/* 上下文变化 */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">
                              上下文变化
                            </span>
                            <div className="space-y-1">
                              {group.observeStep && (
                                <>
                                  <div className="text-[10px] text-white/20">
                                    更新前: {group.observeStep.contextBefore.length} 项
                                    {group.observeStep.contextBefore.length > 0 && (
                                      <span className="ml-1 text-white/15 font-mono">
                                        ...{group.observeStep.contextBefore[group.observeStep.contextBefore.length - 1]?.slice(-40)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-glow-green/60">
                                    +{group.newContextCount} 条新增
                                  </div>
                                  <div className="text-[10px] text-white/20">
                                    更新后: {group.observeStep.contextAfter.length} 项
                                  </div>
                                </>
                              )}
                              {!group.observeStep && group.thinkStep && (
                                <span className="text-[11px] text-white/30">
                                  上下文项: {group.thinkStep.contextAfter.length} 条
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 耗时 */}
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-white/20" />
                            <span className="text-[10px] text-white/25">
                              耗时: {(group.totalDuration / 1000).toFixed(1)}s
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
