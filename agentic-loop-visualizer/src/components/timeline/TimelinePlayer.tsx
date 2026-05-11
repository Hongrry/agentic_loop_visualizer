import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Brain,
  Wrench,
  Eye,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRuntimeStore } from "@/store/runtimeStore";
import type { LoopPhase, LoopStep } from "@/types/runtime";

const phaseIcons: Record<LoopPhase, React.ComponentType<{ className?: string }>> = {
  think: Brain,
  act: Wrench,
  observe: Eye,
  end: Flag,
};

const phaseColors: Record<LoopPhase, string> = {
  think: "text-glow-cyan",
  act: "text-glow-amber",
  observe: "text-glow-green",
  end: "text-accent-400",
};

const phaseBadgeVariant: Record<LoopPhase, "think" | "act" | "observe" | "end"> = {
  think: "think",
  act: "act",
  observe: "observe",
  end: "end",
};

function StepDot({
  step,
  index,
  isCurrent,
  isPast,
  onClick,
}: {
  step: LoopStep;
  index: number;
  isCurrent: boolean;
  isPast: boolean;
  onClick: () => void;
}) {
  const Icon = phaseIcons[step.phase];
  const color = phaseColors[step.phase];

  return (
    <motion.button
      onClick={onClick}
      className="flex flex-col items-center gap-1 min-w-[48px] shrink-0 cursor-pointer group"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      animate={
        isCurrent
          ? {
              scale: [1, 1.05, 1],
              transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
            }
          : {}
      }
    >
      {/* Step number */}
      <span className="text-[10px] text-slate-500 font-mono">[{index + 1}]</span>

      {/* Icon dot */}
      <motion.div
        className="relative flex items-center justify-center"
        animate={
          isCurrent
            ? {
                boxShadow: [
                  "0 0 8px rgba(99,102,241,0.3)",
                  "0 0 16px rgba(99,102,241,0.6)",
                  "0 0 8px rgba(99,102,241,0.3)",
                ],
              }
            : {}
        }
        transition={{ repeat: Infinity, duration: 1.2 }}
      >
        <div
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-300 ${
            isCurrent
              ? "bg-accent-500/20 ring-2 ring-accent-500 ring-offset-2 ring-offset-surface-800"
              : isPast
                ? "bg-surface-600"
                : "bg-surface-700 opacity-50"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${color} ${
              isPast && !isCurrent ? "opacity-70" : isCurrent ? "" : "opacity-40"
            }`}
          />
        </div>
      </motion.div>

      {/* Phase label */}
      <span
        className={`text-[10px] font-medium uppercase tracking-wider transition-colors ${
          isCurrent ? color : isPast ? "text-slate-400" : "text-slate-600"
        }`}
      >
        {step.phase}
      </span>
    </motion.button>
  );
}

export function TimelinePlayer() {
  const steps = useRuntimeStore((s) => s.steps);
  const currentStepIndex = useRuntimeStore((s) => s.currentStepIndex);
  const status = useRuntimeStore((s) => s.status);
  const playing = useRuntimeStore((s) => s.playing);

  const nextStep = useRuntimeStore((s) => s.nextStep);
  const previousStep = useRuntimeStore((s) => s.previousStep);
  const play = useRuntimeStore((s) => s.play);
  const pause = useRuntimeStore((s) => s.pause);
  const replay = useRuntimeStore((s) => s.replay);
  const reset = useRuntimeStore((s) => s.reset);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current step
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-step-index="${currentStepIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentStepIndex]);

  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const hasSteps = steps.length > 0;
  const canPrev = currentStepIndex > 0;
  const canNext = currentStepIndex < steps.length - 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center gap-2 px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={reset}
          disabled={!hasSteps && status === "idle"}
          title="重置"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={replay}
          disabled={!isCompleted}
          title="回放"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="text-[10px] ml-0.5">Replay</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={previousStep}
          disabled={!canPrev}
          title="上一步"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={playing ? pause : play}
          disabled={!canNext && playing}
          title={playing ? "暂停" : "播放"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextStep}
          disabled={!canNext}
          title="下一步"
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Status badge */}
        <div className="ml-auto">
          <Badge
            variant={
              status === "running"
                ? "act"
                : status === "completed"
                  ? "completed"
                  : status === "error"
                    ? "error"
                    : "default"
            }
          >
            {status === "running" && "RUNNING"}
            {status === "completed" && "COMPLETED"}
            {status === "error" && "ERROR"}
            {status === "paused" && "PAUSED"}
            {status === "idle" && "IDLE"}
          </Badge>
        </div>
      </div>

      {/* Timeline track */}
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto px-1 pb-2 scrollbar-thin"
        style={{ scrollbarWidth: "thin" }}
      >
        <AnimatePresence mode="popLayout">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              data-step-index={index}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className="flex items-center gap-1"
            >
              <StepDot
                step={step}
                index={index}
                isCurrent={index === currentStepIndex}
                isPast={index < currentStepIndex}
                onClick={() => useRuntimeStore.setState({ currentStepIndex: index })}
              />
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <motion.div
                  className={`h-px w-4 shrink-0 ${
                    index < currentStepIndex ? "bg-accent-500/40" : "bg-surface-500/30"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1 }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!hasSteps && (
          <div className="flex-1 flex items-center justify-center py-4">
            <p className="text-xs text-slate-600">等待 Agent 执行...</p>
          </div>
        )}
      </div>
    </div>
  );
}
