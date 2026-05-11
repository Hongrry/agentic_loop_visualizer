import { motion } from "framer-motion";
import { Cpu, Activity, Key, Server } from "lucide-react";
import { LoopGraph } from "@/components/loop/LoopGraph";
import { StepDetailPanel } from "@/components/panels/StepDetailPanel";
import { ContextPanel } from "@/components/panels/ContextPanel";
import { TimelinePlayer } from "@/components/timeline/TimelinePlayer";
import { UserInput } from "@/components/input/UserInput";
import { Badge } from "@/components/ui/badge";
import { useRuntimeStore } from "@/store/runtimeStore";
import { getApiConfig } from "@/api/openai";

function ApiStatusIndicator() {
  const { hasKey, model } = getApiConfig();

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1.5">
        <Key className={`h-3 w-3 ${hasKey ? "text-glow-green" : "text-glow-rose"}`} />
        <span className={hasKey ? "text-glow-green" : "text-glow-rose"}>
          {hasKey ? "API 已连接" : "未配置 API 密钥"}
        </span>
      </div>
      <div className="w-px h-3 bg-white/10" />
      <div className="flex items-center gap-1.5">
        <Server className="h-3 w-3 text-white/40" />
        <span className="text-white/40 font-mono">{model}</span>
      </div>
    </div>
  );
}

export default function App() {
  const status = useRuntimeStore((s) => s.status);
  const isActive = status === "running" || status === "completed" || status === "paused";

  return (
    <div className="h-full w-full flex flex-col bg-surface-900 overflow-hidden">
      <header className="shrink-0 border-b border-white/5 bg-surface-800/50 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={
                status === "running"
                  ? {
                      rotate: [0, 360],
                      transition: { repeat: Infinity, duration: 3, ease: "linear" },
                    }
                  : {}
              }
            >
              <Cpu className="h-5 w-5 text-accent-400" />
            </motion.div>
            <h1 className="text-base font-semibold text-white/90 tracking-tight">
              智能体循环可视化
            </h1>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <Badge variant="think" className="gap-1">
                  <Activity className="h-2.5 w-2.5" />
                  运行中
                </Badge>
              </motion.div>
            )}
          </div>
          <ApiStatusIndicator />
        </div>
      </header>

      <main className="flex-1 flex min-h-0 overflow-hidden">
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-[280px] shrink-0 border-r border-white/5 bg-surface-800/20 backdrop-blur-sm"
        >
          <div className="p-4 border-b border-white/5">
            <span className="text-xs font-semibold text-white/35 uppercase tracking-wider">
              循环运行时图谱
            </span>
          </div>
          <div className="h-[calc(100%-49px)]">
            <LoopGraph />
          </div>
        </motion.aside>

        <motion.section
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex-1 min-w-0 border-r border-white/5 p-5"
        >
          <StepDetailPanel />
        </motion.section>

        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="w-[340px] shrink-0 p-5"
        >
          <ContextPanel />
        </motion.aside>
      </main>

      <footer className="shrink-0 border-t border-white/5 bg-surface-800/40 backdrop-blur-xl">
        <div className="px-6 py-4 space-y-3">
          <UserInput />
          {isActive && <TimelinePlayer />}
        </div>
      </footer>
    </div>
  );
}
