import { memo } from "react";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";

type AnimatedEdgeData = {
  isActive: boolean;
  color: string;
};

const AnimatedEdge = memo(({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) => {
  const edgeData = data as unknown as AnimatedEdgeData | undefined;
  const color = edgeData?.color ?? "#0a84ff";
  const isActive = edgeData?.isActive ?? false;

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isActive ? color : "rgba(255,255,255,0.08)",
          strokeWidth: 2,
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
    </>
  );
});

AnimatedEdge.displayName = "AnimatedEdge";

export { AnimatedEdge };
export type { AnimatedEdgeData };
