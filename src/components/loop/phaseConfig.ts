import type { LoopPhase } from "@/types/runtime";
import { Brain, Wrench, Eye, Flag } from "lucide-react";

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
  think: { icon: Brain, color: "#5ac8fa", glowColor: "rgba(90,200,250,0.25)" },
  act: { icon: Wrench, color: "#ff9f0a", glowColor: "rgba(255,159,10,0.25)" },
  observe: { icon: Eye, color: "#30d158", glowColor: "rgba(48,209,88,0.25)" },
  end: { icon: Flag, color: "#0a84ff", glowColor: "rgba(10,132,255,0.25)" },
};

export { phaseConfig };
export type { PhaseNodeData };
