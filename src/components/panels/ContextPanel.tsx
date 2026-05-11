import { motion, AnimatePresence } from "framer-motion";
import { Layers, PlusCircle, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRuntimeStore } from "@/store/runtimeStore";

export function ContextPanel() {
  const steps = useRuntimeStore((s) => s.steps);
  const currentStepIndex = useRuntimeStore((s) => s.currentStepIndex);
  const status = useRuntimeStore((s) => s.status);

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;

  const allContext = currentStep?.contextAfter ?? [];
  const newContext = currentStep?.newContext ?? [];

  if (status === "idle") {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>上下文演化</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-white/30 text-center leading-relaxed">
            运行智能体后<br />在此查看上下文演化过程
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent-400" />
          <CardTitle>上下文演化</CardTitle>
          <Badge variant="default" className="ml-auto">
            {allContext.length} 项
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep?.id ?? "empty"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-4"
          >
            {currentStep && (
              <>
                <div className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">
                  更新前上下文
                </div>
                <ContextBlock items={currentStep.contextBefore} variant="before" />
              </>
            )}

            {newContext.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 my-3">
                  <PlusCircle className="h-3 w-3 text-glow-green" />
                  <div className="text-xs font-semibold text-glow-green uppercase tracking-wider">
                    新增上下文
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-glow-green/20 to-transparent" />
                </div>
                <ContextBlock items={newContext} variant="added" />
              </motion.div>
            )}

            {currentStep && newContext.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.35, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 my-3">
                  <ArrowRight className="h-3 w-3 text-white/40" />
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    更新后上下文
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                </div>
                <ContextBlock items={currentStep.contextAfter} variant="after" />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {allContext.length === 0 && !currentStep && (
          <p className="text-sm text-white/30 text-center">暂无上下文数据</p>
        )}
      </CardContent>
    </Card>
  );
}

type BlockVariant = "before" | "added" | "after";

const blockStyles: Record<BlockVariant, { border: string; bg: string; text: string }> = {
  before: {
    border: "border-white/5",
    bg: "bg-white/[0.02]",
    text: "text-white/50",
  },
  added: {
    border: "border-glow-green/15",
    bg: "bg-glow-green/6",
    text: "text-glow-green",
  },
  after: {
    border: "border-accent-500/15",
    bg: "bg-accent-500/[0.03]",
    text: "text-white/70",
  },
};

function ContextBlock({ items, variant }: { items: string[]; variant: BlockVariant }) {
  const style = blockStyles[variant];

  if (items.length === 0) {
    return (
      <div className={`rounded-lg border ${style.border} ${style.bg} p-4 text-sm text-white/30 italic`}>
        暂无数据
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <motion.div
          key={`${variant}-${i}`}
          initial={variant === "added" ? { opacity: 0, x: -10 } : { opacity: 1 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: variant === "added" ? i * 0.08 : 0, duration: 0.3, ease: "easeOut" }}
          className={`rounded-lg border ${style.border} ${style.bg} p-3 text-xs ${style.text} font-mono leading-relaxed`}
        >
          {variant === "added" && (
            <span className="text-glow-green mr-1">+</span>
          )}
          {item}
        </motion.div>
      ))}
    </div>
  );
}
