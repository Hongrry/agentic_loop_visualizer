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
  const { hasKey, model, baseUrl: _baseUrl } = getApiConfig();

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex items-center gap-1.5">
        <Key className={`h-3 w-3 ${hasKey ? "text-glow-green" : "text-glow-rose"}`} />
        <span className={hasKey ? "text-glow-green" : "text-glow-rose"}>
          {hasKey ? "API Connected" : "No API Key"}
        </span>
      </div>
      <div className="w-px h-3 bg-surface-500/50" />
      <div className="flex items-center gap-1.5">
        <Server className="h-3 w-3 text-slate-500" />
        <span className="text-slate-500 font-mono">{model}</span>
      </div>
    </div>
  );
}

export default function App() {
  const status = useRuntimeStore((s) => s.status);
  const isActive = status === "running" || status === "completed" || status === "paused";

  return (
    <div className="h-full w-full flex flex-col bg-surface-900 overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-surface-500/30 bg-surface-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 py-3">
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
            <h1 className="text-base font-bold text-slate-100 tracking-wide">
              Agentic Loop Visualizer
            </h1>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Badge variant="think" className="gap-1">
                  <Activity className="h-2.5 w-2.5" />
                  Active
                </Badge>
              </motion.div>
            )}
          </div>
          <ApiStatusIndicator />
        </div>
      </header>

      {/* Main Content: Three Columns */}
      <main className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Loop Graph */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-[280px] shrink-0 border-r border-surface-500/30 bg-surface-800/30"
        >
          <div className="p-3 border-b border-surface-500/20">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Loop Runtime Graph
            </span>
          </div>
          <div className="h-[calc(100%-41px)]">
            <LoopGraph />
          </div>
        </motion.aside>

        {/* Center: Step Detail */}
        <motion.section
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 min-w-0 border-r border-surface-500/30 p-4"
        >
          <StepDetailPanel />
        </motion.section>

        {/* Right: Context Evolution */}
        <motion.aside
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-[340px] shrink-0 p-4"
        >
          <ContextPanel />
        </motion.aside>
      </main>

      {/* Bottom: Input + Timeline */}
      <footer className="shrink-0 border-t border-surface-500/30 bg-surface-800/50 backdrop-blur-sm">
        <div className="px-5 py-3 space-y-3">
          <UserInput />
          {isActive && <TimelinePlayer />}
        </div>
      </footer>
    </div>
  );
}
