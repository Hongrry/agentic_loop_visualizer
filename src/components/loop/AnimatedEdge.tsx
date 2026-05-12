import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

type AnimatedEdgeData = {
  isActive: boolean;
  color: string;
  dashed?: boolean;
};

const AnimatedEdge = memo(({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, markerStart, data }: EdgeProps) => {
  const edgeData = data as unknown as AnimatedEdgeData | undefined;
  const color = edgeData?.color ?? "#0a84ff";
  const isActive = edgeData?.isActive ?? false;
  const dashed = edgeData?.dashed ?? false;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      markerStart={markerStart}
      style={{
        stroke: isActive ? color : "rgba(255,255,255,0.22)",
        strokeWidth: isActive ? 2 : 1.5,
        strokeDasharray: dashed ? "6 4" : undefined,
        opacity: isActive ? 0.7 : 0.45,
        transition: "stroke 0.7s ease, opacity 0.7s ease",
      }}
    />
  );
});

AnimatedEdge.displayName = "AnimatedEdge";

export { AnimatedEdge };
export type { AnimatedEdgeData };
