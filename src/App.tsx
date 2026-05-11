import { motion } from "framer-motion";
import { Cpu, Activity, Key, Server } from "lucide-react";
import { LoopGraph } from "@/components/loop/LoopGraph";
import { StepDetailPanel } from "@/components/panels/StepDetailPanel";
import { DecisionTrail } from "@/components/panels/DecisionTrail";
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
      {/* 顶部：标题栏 + 用户输入 */}
      <header className="shrink-0 border-b border-white/5 bg-surface-800/50 backdrop-blur-xl px-5 py-3">
        <div className="flex items-center gap-4">
          <motion.div
            animate={
              status === "running"
                ? {
                    rotate: [0, 360],
                    transition: { repeat: Infinity, duration: 3, ease: "linear" },
                  }
                : {}
            }
            className="shrink-0"
          >
            <Cpu className="h-4 w-4 text-accent-400" />
          </motion.div>
          <h1 className="text-sm font-semibold text-white/85 tracking-tight shrink-0">
            智能体循环可视化
          </h1>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="shrink-0"
            >
              <Badge variant="think" className="gap-1 text-[10px]">
                <Activity className="h-2 w-2" />
                运行中
              </Badge>
            </motion.div>
          )}
          <div className="flex-1">
            <UserInput />
          </div>
          <ApiStatusIndicator />
        </div>
      </header>

      {/* 中部：三栏布局 — 决策链路 | 循环图谱 | 步骤详细 */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex-[2] min-w-0 border-r border-white/5"
        >
          <DecisionTrail />
        </motion.aside>

        <motion.section
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="flex-[6] min-w-0 border-r border-white/5 flex flex-col"
        >
          <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
            <span className="text-xs font-semibold text-white/35 uppercase tracking-wider">
              循环运行时图谱
            </span>
          </div>
          <div className="flex-1">
            <LoopGraph />
          </div>
        </motion.section>

        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="flex-[2] min-w-0 p-4 flex flex-col min-h-0"
        >
          <StepDetailPanel />
        </motion.aside>
      </main>

      {/* 底部：循环节点 / Timeline Player */}
      { (
        <footer className="shrink-0 border-t border-white/5 bg-surface-800/40 backdrop-blur-xl">
          <div className="px-5 py-3">
            <TimelinePlayer />
          </div>
        </footer>
      )}
    </div>
  );
}
