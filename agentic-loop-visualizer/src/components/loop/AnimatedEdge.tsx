import { memo } from "react";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";

type AnimatedEdgeData = {
  isActive: boolean;
  color: string;
};

const AnimatedEdge = memo(({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps) => {
  const edgeData = data as unknown as AnimatedEdgeData | undefined;
  const color = edgeData?.color ?? "#6366f1";
  const isActive = edgeData?.isActive ?? false;

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      {/* Background edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isActive ? color : "#313145",
          strokeWidth: 2,
          opacity: isActive ? 0.8 : 0.3,
          transition: "stroke 0.5s ease, opacity 0.5s ease",
        }}
      />

      {/* Animated dot traveling along edge */}
      {isActive && (
        <>
          <circle r="4" fill={color} opacity="0.9">
            <animateMotion
              dur="1s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
          <circle r="8" fill={color} opacity="0.2">
            <animateMotion
              dur="1s"
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
