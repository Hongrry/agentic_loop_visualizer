import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
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

const statusLabels: Record<string, string> = {
  running: "运行中",
  completed: "已完成",
  error: "出错",
  paused: "已暂停",
  idle: "空闲",
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
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      animate={
        isCurrent
          ? {
              scale: [1, 1.04, 1],
              transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
            }
          : {}
      }
    >
      <span className="text-[10px] text-white/30 font-mono">[{index + 1}]</span>

      <motion.div
        className="relative flex items-center justify-center"
        animate={
          isCurrent
            ? {
                boxShadow: [
                  "0 0 8px rgba(10,132,255,0.2)",
                  "0 0 16px rgba(10,132,255,0.4)",
                  "0 0 8px rgba(10,132,255,0.2)",
                ],
              }
            : {}
        }
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <div
          className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
            isCurrent
              ? "bg-accent-500/15 ring-2 ring-accent-500/50 ring-offset-2 ring-offset-surface-900"
              : isPast
                ? "bg-white/10"
                : "bg-white/[0.03] opacity-50"
          }`}
        >
          <Icon
            className={`h-4 w-4 ${color} ${
              isPast && !isCurrent ? "opacity-60" : isCurrent ? "" : "opacity-35"
            }`}
          />
        </div>
      </motion.div>

      <span
        className={`text-[10px] font-medium uppercase tracking-wider transition-colors duration-500 ${
          isCurrent ? color : isPast ? "text-white/50" : "text-white/25"
        }`}
      >
        {step.phase === "think" ? "思考" : step.phase === "act" ? "执行" : step.phase === "observe" ? "观察" : "结束"}
      </span>
    </motion.button>
  );
}

export function TimelinePlayer() {
  const steps = useRuntimeStore((s) => s.steps);
  const currentStepIndex = useRuntimeStore((s) => s.currentStepIndex);
  const status = useRuntimeStore((s) => s.status);
  const playing = useRuntimeStore((s) => s.playing);

  const speed = useRuntimeStore((s) => s.speed);
  const setSpeed = (s: number) => useRuntimeStore.setState({ speed: s });

  const nextStep = useRuntimeStore((s) => s.nextStep);
  const previousStep = useRuntimeStore((s) => s.previousStep);
  const play = useRuntimeStore((s) => s.play);
  const pause = useRuntimeStore((s) => s.pause);
  const replay = useRuntimeStore((s) => s.replay);
  const reset = useRuntimeStore((s) => s.reset);

  const handleStepClick = (index: number) => {
    pause();
    useRuntimeStore.setState({ currentStepIndex: index });
  };

  const speedOptions = [0.5, 1, 2, 4];

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-step-index="${currentStepIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentStepIndex]);

  const isCompleted = status === "completed";
  const hasSteps = steps.length > 0;
  const canPrev = currentStepIndex > 0;
  const canNext = currentStepIndex < steps.length - 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 px-1">
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

        <div className="w-px h-4 bg-white/10 mx-1" />
        <div className="flex items-center gap-0.5">
          <Gauge className="h-3 w-3 text-white/30 shrink-0" />
          {speedOptions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors duration-200 cursor-pointer ${
                speed === s
                  ? "bg-accent-500/15 text-accent-400"
                  : "text-white/35 hover:text-white/60 hover:bg-white/5"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-white/10 mx-1" />
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
            {statusLabels[status] ?? status}
          </Badge>
        </div>
      </div>

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
              transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
              className="flex items-center gap-1"
            >
              <StepDot
                step={step}
                index={index}
                isCurrent={index === currentStepIndex}
                isPast={index < currentStepIndex}
                onClick={() => handleStepClick(index)}
              />
              {index < steps.length - 1 && (
                <motion.div
                  className={`h-px w-4 shrink-0 ${
                    index < currentStepIndex ? "bg-accent-500/30" : "bg-white/8"
                  }`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!hasSteps && (
          <div className="flex-1 flex items-center justify-center py-4">
            <p className="text-xs text-white/20">等待智能体执行...</p>
          </div>
        )}
      </div>
    </div>
  );
}
