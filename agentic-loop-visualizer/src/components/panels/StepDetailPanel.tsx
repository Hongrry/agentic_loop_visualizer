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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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

function ThinkContent({ step }: { step: LoopStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {step.goal && (
        <div>
          <Label>当前目标</Label>
          <div className="mt-1 rounded-lg bg-surface-700/50 p-3 text-sm text-slate-200 border border-surface-500/30">
            {step.goal}
          </div>
        </div>
      )}
      {step.decision && (
        <div>
          <Label>决策</Label>
          <div className="mt-1 flex items-center gap-2 rounded-lg bg-glow-amber/10 p-3 text-sm text-glow-amber border border-glow-amber/20">
            <ChevronRight className="h-4 w-4 shrink-0" />
            {step.decision}
          </div>
        </div>
      )}
      {step.thought && (
        <div>
          <Label>推理内容</Label>
          <div className="mt-1 rounded-lg bg-surface-700/50 p-3 text-sm text-slate-300 font-mono leading-relaxed border border-surface-500/30">
            {step.thought}
          </div>
        </div>
      )}
      {step.apiResponse?.content && (
        <div>
          <Label>API 响应文本</Label>
          <div className="mt-1 rounded-lg bg-surface-700/50 p-3 text-sm text-slate-300 font-mono leading-relaxed border border-surface-500/30 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {step.apiResponse.content}
          </div>
        </div>
      )}
      {step.duration !== undefined && step.duration > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
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
      className="space-y-4"
    >
      <div>
        <Label>Tool 名称</Label>
        <div className="mt-1 rounded-lg bg-glow-amber/10 p-3 text-sm text-glow-amber border border-glow-amber/20 font-mono">
          {step.toolName ?? "未知"}
        </div>
      </div>
      {step.toolInput && (
        <div>
          <Label>输入参数</Label>
          <pre className="mt-1 rounded-lg bg-surface-700/50 p-3 text-xs text-slate-300 font-mono leading-relaxed border border-surface-500/30 overflow-x-auto">
            {JSON.stringify(step.toolInput, null, 2)}
          </pre>
        </div>
      )}
      {step.toolOutput ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 0.3 }}
        >
          <Label>执行结果</Label>
          <pre className="mt-1 rounded-lg bg-glow-green/10 p-3 text-xs text-glow-green font-mono leading-relaxed border border-glow-green/20 overflow-x-auto">
            {JSON.stringify(step.toolOutput, null, 2)}
          </pre>
        </motion.div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-glow-amber">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在执行 {step.toolName ?? "tool"}...
        </div>
      )}
      {step.duration !== undefined && step.duration > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-500">
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
      className="space-y-4"
    >
      <div>
        <Label>上下文更新前</Label>
        <ContextList items={step.contextBefore} />
      </div>
      {step.newContext && step.newContext.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Label>新增上下文</Label>
          <div className="mt-1 space-y-1">
            {step.newContext.map((ctx, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="rounded-lg bg-glow-green/10 p-2 text-sm text-glow-green border border-glow-green/20 font-mono"
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
        transition={{ delay: 0.4 }}
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
      className="space-y-4"
    >
      <div>
        <Label>最终答案</Label>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-1 rounded-lg bg-accent-500/10 p-4 text-sm text-slate-100 border border-accent-500/30 leading-relaxed whitespace-pre-wrap"
        >
          {step.finalAnswer ?? "无最终答案"}
        </motion.div>
      </div>
      {step.thought && (
        <div>
          <Label>执行总结</Label>
          <div className="mt-1 rounded-lg bg-surface-700/50 p-3 text-sm text-slate-300 border border-surface-500/30">
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
      <div className="mt-1 rounded-lg bg-surface-700/30 p-3 text-sm text-slate-500 border border-surface-500/20 italic">
        暂无上下文
      </div>
    );
  }
  return (
    <ul className="mt-1 space-y-1">
      {items.map((item, i) => (
        <li
          key={i}
          className="rounded-lg bg-surface-700/30 p-2 text-sm text-slate-400 border border-surface-500/20 font-mono text-xs"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{children}</div>;
}

export function StepDetailPanel() {
  const steps = useRuntimeStore((s) => s.steps);
  const currentStepIndex = useRuntimeStore((s) => s.currentStepIndex);
  const status = useRuntimeStore((s) => s.status);

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const PhaseIcon = currentStep ? phaseIcons[currentStep.phase] : Brain;

  if (status === "idle") {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Step Detail</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500 text-center">
            输入您的问题并点击 Run<br />开始查看 Agent 运行详情
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    const errorMsg = useRuntimeStore.getState().error;
    return (
      <Card className="h-full flex flex-col border-glow-rose/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-glow-rose" />
            <CardTitle className="text-glow-rose">执行出错</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-glow-rose/10 p-4 text-sm text-glow-rose border border-glow-rose/20">
            {errorMsg ?? "发生未知错误"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          {currentStep && PhaseIcon && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.phase + currentStep.id}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <PhaseIcon className={`h-4 w-4 ${phaseColors[currentStep.phase]}`} />
              </motion.div>
            </AnimatePresence>
          )}
          <CardTitle>{currentStep?.title ?? "Step Detail"}</CardTitle>
          {currentStep && (
            <Badge variant={phaseBadgeVariant[currentStep.phase]}>
              {currentStep.phase.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep?.id ?? "empty"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep?.phase === "think" && <ThinkContent step={currentStep} />}
            {currentStep?.phase === "act" && <ActContent step={currentStep} />}
            {currentStep?.phase === "observe" && <ObserveContent step={currentStep} />}
            {currentStep?.phase === "end" && <EndContent step={currentStep} />}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
