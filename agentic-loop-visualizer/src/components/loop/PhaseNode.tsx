import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { Brain, Wrench, Eye, Flag } from "lucide-react";
import type { LoopPhase } from "@/types/runtime";

type PhaseNodeData = {
  phase: LoopPhase;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
};

const phaseConfig: Record<
  LoopPhase,
  { icon: React.ComponentType<{ className?: string }>; color: string; glowColor: string }
> = {
  think: { icon: Brain, color: "#22d3ee", glowColor: "rgba(34,211,238,0.4)" },
  act: { icon: Wrench, color: "#fbbf24", glowColor: "rgba(251,191,36,0.4)" },
  observe: { icon: Eye, color: "#34d399", glowColor: "rgba(52,211,153,0.4)" },
  end: { icon: Flag, color: "#818cf8", glowColor: "rgba(129,140,248,0.4)" },
};

const PhaseNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as PhaseNodeData;
  const config = phaseConfig[nodeData.phase];
  const Icon = config.icon;

  return (
    <motion.div
      className="relative"
      animate={
        nodeData.isActive
          ? { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }
          : { scale: 1 }
      }
    >
      {/* Glow effect */}
      {nodeData.isActive && (
        <motion.div
          className="absolute inset-0 rounded-2xl blur-xl"
          style={{ backgroundColor: config.glowColor }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />
      )}

      <div
        className="relative flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-4 min-w-[120px] border z-10"
        style={{
          backgroundColor: nodeData.isActive ? `${config.color}15` : nodeData.isCompleted ? `${config.color}10` : "#1a1a24",
          borderColor: nodeData.isActive ? config.color : nodeData.isCompleted ? `${config.color}50` : "#313145",
          boxShadow: nodeData.isActive ? `0 0 20px ${config.glowColor}` : "none",
        }}
      >
        <Handle type="target" position={Position.Top} className="!bg-surface-500" />
        <div
          style={{
            color: config.color,
            opacity: nodeData.isCompleted && !nodeData.isActive ? 0.7 : 1,
          }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: nodeData.isActive ? config.color : nodeData.isCompleted ? `${config.color}90` : "#6b7280" }}
        >
          {nodeData.label}
        </span>
        <Handle type="source" position={Position.Bottom} className="!bg-surface-500" />
      </div>
    </motion.div>
  );
});

PhaseNode.displayName = "PhaseNode";

export { PhaseNode, phaseConfig };
export type { PhaseNodeData };
