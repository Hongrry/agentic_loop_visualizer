import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Wrench,
  Eye,
  Flag,
  Loader2,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRuntimeStore } from "@/store/runtimeStore";
import type { LoopStep } from "@/types/runtime";

const phaseIcons = {
  think: Brain,
  act: Wrench,
  observe: Eye,
  end: Flag,
} as const;

const phaseColors = {
  think: "text-glow-cyan" as const,
  act: "text-glow-amber" as const,
  observe: "text-glow-green" as const,
  end: "text-accent-400" as const,
};

const phaseBadgeVariant = {
  think: "think" as const,
  act: "act" as const,
  observe: "observe" as const,
  end: "end" as const,
};

const phaseBadgeLabel: Record<string, string> = {
  think: "思考",
  act: "执行",
  observe: "观察",
  end: "结束",
};

function ThinkContent({ step }: { step: LoopStep }) {
  const status = useRuntimeStore((s) => s.status);
  const isStreaming = status === "running";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      {step.goal && (
        <div>
          <Label>当前目标</Label>
          <div className="mt-1.5 rounded-lg bg-white/[0.04] p-4 text-sm text-white/80 border border-white/5">
            {step.goal}
          </div>
        </div>
      )}
      {step.decision && (
        <div>
          <Label>决策</Label>
          <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-glow-amber/8 p-4 text-sm text-glow-amber border border-glow-amber/15">
            <ChevronRight className="h-4 w-4 shrink-0" />
            {step.decision}
          </div>
        </div>
      )}
      {step.thought && (
        <div>
          <div className="flex items-center gap-2">
            <Label>推理内容</Label>
            {isStreaming && (
              <span className="flex items-center gap-1 text-xs text-accent-400">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="h-1.5 w-1.5 rounded-full bg-accent-400"
                />
                实时接收中
              </span>
            )}
          </div>
          <div className="mt-1.5 rounded-lg bg-white/[0.04] p-4 text-sm text-white/70 font-mono leading-relaxed border border-white/5 max-h-60 overflow-y-auto whitespace-pre-wrap">
            {step.thought}
          </div>
        </div>
      )}
      {step.duration !== undefined && step.duration > 0 && !isStreaming && (
        <div className="flex items-center gap-1.5 text-xs text-white/35">
          <Clock className="h-3 w-3" />
          耗时: {step.duration}ms
        </div>
      )}
    </motion.div>
  );
}

function ActContent({ step }: { step: LoopStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      <div>
        <Label>工具名称</Label>
        <div className="mt-1.5 rounded-lg bg-glow-amber/8 p-4 text-sm text-glow-amber border border-glow-amber/15 font-mono">
          {step.toolName ?? "未知"}
        </div>
      </div>
      {step.toolInput && (
        <div>
          <Label>输入参数</Label>
          <pre className="mt-1.5 rounded-lg bg-white/[0.04] p-4 text-xs text-white/70 font-mono leading-relaxed border border-white/5 overflow-x-auto">
            {JSON.stringify(step.toolInput, null, 2)}
          </pre>
        </div>
      )}
      {step.toolOutput ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
        >
          <Label>执行结果</Label>
          <pre className="mt-1.5 rounded-lg bg-glow-green/8 p-4 text-xs text-glow-green font-mono leading-relaxed border border-glow-green/15 overflow-x-auto">
            {JSON.stringify(step.toolOutput, null, 2)}
          </pre>
        </motion.div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-glow-amber">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在执行 {step.toolName ?? "工具"}...
        </div>
      )}
      {step.duration !== undefined && step.duration > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-white/35">
          <Clock className="h-3 w-3" />
          耗时: {step.duration}ms
        </div>
      )}
    </motion.div>
  );
}

function ObserveContent({ step }: { step: LoopStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      <div>
        <Label>上下文更新前</Label>
        <ContextList items={step.contextBefore} />
      </div>
      {step.newContext && step.newContext.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.35, ease: "easeOut" }}
        >
          <Label>新增上下文</Label>
          <div className="mt-1.5 space-y-1.5">
            {step.newContext.map((ctx, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.3, ease: "easeOut" }}
                className="rounded-lg bg-glow-green/8 p-3 text-sm text-glow-green border border-glow-green/15 font-mono"
              >
                + {ctx}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.35, ease: "easeOut" }}
      >
        <Label>上下文更新后</Label>
        <ContextList items={step.contextAfter} />
      </motion.div>
    </motion.div>
  );
}

function EndContent({ step }: { step: LoopStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5"
    >
      <div>
        <Label>最终答案</Label>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
          className="mt-1.5 rounded-lg bg-accent-500/8 p-4 text-sm text-white/85 border border-accent-500/20 leading-relaxed whitespace-pre-wrap"
        >
          {step.finalAnswer ?? "暂无最终答案"}
        </motion.div>
      </div>
      {step.thought && (
        <div>
          <Label>执行总结</Label>
          <div className="mt-1.5 rounded-lg bg-white/[0.04] p-4 text-sm text-white/70 border border-white/5">
            {step.thought}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ContextList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-1.5 rounded-lg bg-white/[0.02] p-4 text-sm text-white/30 border border-white/5 italic">
        暂无上下文
      </div>
    );
  }
  return (
    <ul className="mt-1.5 space-y-1">
      {items.map((item, i) => (
        <li
          key={i}
          className="rounded-lg bg-white/[0.02] p-3 text-sm text-white/50 border border-white/5 font-mono text-xs"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">{children}</div>;
}

export function StepDetailPanel() {
  const steps = useRuntimeStore((s) => s.steps);
  const currentStepIndex = useRuntimeStore((s) => s.currentStepIndex);
  const status = useRuntimeStore((s) => s.status);

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const PhaseIcon = currentStep ? phaseIcons[currentStep.phase] : Brain;

  if (status === "idle") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          <span className="text-xs font-semibold text-white/35 uppercase tracking-wider">步骤详情</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-white/25 text-center leading-relaxed px-4">
            输入您的问题并点击运行，开始查看智能体运行详情
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    const errorMsg = useRuntimeStore.getState().error;
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          <AlertCircle className="h-3.5 w-3.5 text-glow-rose" />
          <span className="text-xs font-semibold text-glow-rose uppercase tracking-wider">执行出错</span>
        </div>
        <div className="flex-1 p-4">
          <div className="rounded-lg bg-glow-rose/8 p-4 text-sm text-glow-rose border border-glow-rose/15">
            {errorMsg ?? "发生未知错误"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        {currentStep && PhaseIcon && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.phase + currentStep.id}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <PhaseIcon className={`h-3.5 w-3.5 ${phaseColors[currentStep.phase]}`} />
            </motion.div>
          </AnimatePresence>
        )}
        <span className="text-xs font-semibold text-white/35 uppercase tracking-wider">
          {currentStep?.title ?? "步骤详情"}
        </span>
        {currentStep && (
          <Badge variant={phaseBadgeVariant[currentStep.phase]} className="text-[10px]">
            {phaseBadgeLabel[currentStep.phase]}
          </Badge>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep?.id ?? "empty"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {currentStep?.phase === "think" && <ThinkContent step={currentStep} />}
            {currentStep?.phase === "act" && <ActContent step={currentStep} />}
            {currentStep?.phase === "observe" && <ObserveContent step={currentStep} />}
            {currentStep?.phase === "end" && <EndContent step={currentStep} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
