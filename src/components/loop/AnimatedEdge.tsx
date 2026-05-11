import { memo } from "react";
import { BaseEdge, getStraightPath, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";

type AnimatedEdgeData = {
  isActive: boolean;
  color: string;
  label?: string;
  dashed?: boolean;
};

const AnimatedEdge = memo(({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) => {
  const edgeData = data as unknown as AnimatedEdgeData | undefined;
  const color = edgeData?.color ?? "#0a84ff";
  const isActive = edgeData?.isActive ?? false;
  const label = edgeData?.label;
  const dashed = edgeData?.dashed ?? false;

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const offset = 18;
  const labelX = midX + offset;
  const labelY = midY;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isActive ? color : "rgba(255,255,255,0.08)",
          strokeWidth: 2,
          strokeDasharray: dashed ? "6 4" : undefined,
          opacity: isActive ? 0.6 : 0.25,
          transition: "stroke 0.7s ease, opacity 0.7s ease",
        }}
      />

      {isActive && (
        <>
          <circle r="3.5" fill={color} opacity="0.8">
            <animateMotion
              dur="1.2s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
          <circle r="7" fill={color} opacity="0.12">
            <animateMotion
              dur="1.2s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
        </>
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="text-[10px] text-white/50 bg-surface-800/80 backdrop-blur-sm px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap transition-opacity duration-500"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

AnimatedEdge.displayName = "AnimatedEdge";

export { AnimatedEdge };
export type { AnimatedEdgeData };
