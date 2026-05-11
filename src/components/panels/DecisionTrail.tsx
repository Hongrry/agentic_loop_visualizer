import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRuntimeStore } from "@/store/runtimeStore";
import { phaseConfig } from "@/components/loop/phaseConfig";
import { DecisionDetailDrawer } from "@/components/panels/DecisionDetailDrawer";
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

export type RoundGroup = {
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

  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  const groups = useMemo(() => groupStepsByRound(steps), [steps]);

  const currentIndex = selectedRound !== null
    ? groups.findIndex((g) => g.round === selectedRound)
    : -1;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedRound(groups[currentIndex - 1].round);
    }
  };

  const handleNext = () => {
    if (currentIndex < groups.length - 1) {
      setSelectedRound(groups[currentIndex + 1].round);
    }
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
    <>
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
                const hasDecision = !!group.decisionReason;

                return (
                  <motion.div
                    key={group.round}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3, ease: "easeOut" }}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRound(group.round)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer"
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
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {selectedRound !== null && (
        <DecisionDetailDrawer
          key="decision-drawer"
          groups={groups}
          selectedRound={selectedRound}
          onClose={() => setSelectedRound(null)}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </>
  );
}
