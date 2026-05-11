import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { phaseConfig } from "./phaseConfig";
import type { PhaseNodeData } from "./phaseConfig";

const PhaseNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as PhaseNodeData;
  const config = phaseConfig[nodeData.phase];
  const Icon = config.icon;

  return (
    <motion.div
      className="relative"
      animate={
        nodeData.isActive
          ? { scale: [1, 1.06, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
          : { scale: 1 }
      }
    >
      {nodeData.isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl blur-2xl"
          style={{ backgroundColor: config.glowColor }}
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />
      )}

      <div
        className="relative flex flex-col items-center justify-center gap-2.5 rounded-xl px-5 py-3 min-w-[110px] border backdrop-blur-md z-10 transition-colors duration-500 ease-out"
        style={{
          backgroundColor: nodeData.isActive ? `${config.color}12` : nodeData.isCompleted ? `${config.color}0a` : "#1c1c1e",
          borderColor: nodeData.isActive ? `${config.color}60` : nodeData.isCompleted ? `${config.color}25` : "rgba(255,255,255,0.08)",
          boxShadow: nodeData.isActive ? `0 0 30px ${config.glowColor}` : "none",
        }}
      >
        <Handle type="target" position={Position.Top} className="!bg-white/20" />
        <div
          style={{
            color: config.color,
            opacity: nodeData.isCompleted && !nodeData.isActive ? 0.6 : 1,
          }}
        >
          <Icon className="h-7 w-7" />
        </div>
        <span
          className="text-xs font-semibold tracking-wider"
          style={{ color: nodeData.isActive ? config.color : nodeData.isCompleted ? `${config.color}80` : "rgba(255,255,255,0.35)" }}
        >
          {nodeData.label}
        </span>
        <Handle type="source" position={Position.Bottom} className="!bg-white/20" />
      </div>
    </motion.div>
  );
});

PhaseNode.displayName = "PhaseNode";

export { PhaseNode };
