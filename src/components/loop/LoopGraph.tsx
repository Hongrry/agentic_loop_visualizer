import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
  type ConnectionLineComponent,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PhaseNode } from "./PhaseNode";
import type { PhaseNodeData } from "./phaseConfig";
import { AnimatedEdge } from "./AnimatedEdge";
import type { AnimatedEdgeData } from "./AnimatedEdge";
import { useRuntimeStore } from "@/store/runtimeStore";
import { phaseConfig } from "./phaseConfig";
import type { LoopPhase, LoopStep } from "@/types/runtime";

function hasDirectThinkToEnd(steps: LoopStep[]): boolean {
  for (let i = 1; i < steps.length; i++) {
    if (steps[i].phase === "end" && steps[i - 1].phase === "think") {
      return true;
    }
  }
  return false;
}

const nodeTypes = { phaseNode: PhaseNode };
const edgeTypes = { animated: AnimatedEdge };

const phaseOrder: LoopPhase[] = ["think", "act", "observe", "end"];

// Triangle ring layout: think/act/observe form a circle, end exits left
const nodePositions: Record<LoopPhase, { x: number; y: number }> = {
  think: { x: 120, y: 40 },
  act: { x: 280, y: 160 },
  observe: { x: 120, y: 280 },
  end: { x: 0, y: 160 },
};

function getCurrentPhase(step: LoopStep | undefined): LoopPhase | null {
  if (!step) return null;
  return step.phase;
}

function getCompletedPhases(steps: LoopStep[], currentIndex: number): Set<LoopPhase> {
  const completed = new Set<LoopPhase>();
  if (currentIndex < 0) return completed;
  for (let i = 0; i <= currentIndex; i++) {
    completed.add(steps[i].phase);
  }
  return completed;
}

const ConnectionLine: ConnectionLineComponent = ({ fromX, fromY, toX, toY }) => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const path = `M${fromX},${fromY} C${fromX + dx * 0.5},${fromY + dy * 0.5} ${toX - dx * 0.5},${toY - dy * 0.5} ${toX},${toY}`;
  return (
    <g>
      <path fill="none" stroke="#0a84ff" strokeWidth={2} d={path} />
      <circle r={4} fill="#0a84ff">
        <animateMotion dur="0.6s" repeatCount="indefinite" path={path} />
      </circle>
    </g>
  );
};

export function LoopGraph() {
  const steps = useRuntimeStore((s) => s.steps);
  const currentStepIndex = useRuntimeStore((s) => s.currentStepIndex);
  const status = useRuntimeStore((s) => s.status);

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const currentPhase = getCurrentPhase(currentStep);
  const completedPhases = getCompletedPhases(steps, currentStepIndex);

  const nodes: Node<PhaseNodeData>[] = useMemo(() => {
    return phaseOrder.map((phase) => ({
      id: phase,
      type: "phaseNode",
      position: nodePositions[phase],
      data: {
        phase,
        label: phase === "think" ? "思考" : phase === "act" ? "执行" : phase === "observe" ? "观察" : "结束",
        isActive: currentPhase === phase && (status === "running" || status === "completed" || status === "paused"),
        isCompleted: completedPhases.has(phase),
      },
    }));
  }, [currentPhase, completedPhases, status]);

  const edges: Edge<AnimatedEdgeData>[] = useMemo(() => {
    const edgeList: Edge<AnimatedEdgeData>[] = [];
    const running = status !== "idle";

    // An edge is active when source is completed AND target is the current phase
    // This shows the "flow" direction — only the edge leading to the current node lights up

    // think → act (top → right)
    edgeList.push({
      id: "e-think-act",
      source: "think",
      target: "act",
      type: "animated",
      sourceHandle: "s-right",
      targetHandle: "t-left",
      markerEnd: { type: MarkerType.ArrowClosed, color: phaseConfig.think.color, width: 16, height: 16 },
      data: {
        isActive: completedPhases.has("think") && currentPhase === "act" && running,
        color: phaseConfig.think.color,
      },
    });

    // act → observe (right → bottom)
    edgeList.push({
      id: "e-act-observe",
      source: "act",
      target: "observe",
      type: "animated",
      sourceHandle: "s-bottom",
      targetHandle: "t-right",
      markerEnd: { type: MarkerType.ArrowClosed, color: phaseConfig.act.color, width: 16, height: 16 },
      data: {
        isActive: completedPhases.has("act") && currentPhase === "observe" && running,
        color: phaseConfig.act.color,
      },
    });

    // observe → end (bottom → left)
    edgeList.push({
      id: "e-observe-end",
      source: "observe",
      target: "end",
      type: "animated",
      sourceHandle: "s-left",
      targetHandle: "t-right",
      markerEnd: { type: MarkerType.ArrowClosed, color: phaseConfig.observe.color, width: 16, height: 16 },
      data: {
        isActive: completedPhases.has("observe") && currentPhase === "end" && running,
        color: phaseConfig.observe.color,
      },
    });

    // observe → think (loop back)
    edgeList.push({
      id: "e-observe-think-loop",
      source: "observe",
      target: "think",
      type: "animated",
      sourceHandle: "s-top",
      targetHandle: "t-bottom",
      markerEnd: { type: MarkerType.ArrowClosed, color: phaseConfig.observe.color, width: 16, height: 16 },
      data: {
        isActive: completedPhases.has("observe") && currentPhase === "think" && running,
        color: phaseConfig.observe.color,
      },
      style: { strokeDasharray: "6 4" },
    });

    // think → end (direct exit when no tool calls)
    if (hasDirectThinkToEnd(steps)) {
      edgeList.push({
        id: "e-think-end-direct",
        source: "think",
        target: "end",
        type: "animated",
        sourceHandle: "s-left",
        targetHandle: "t-top",
        markerEnd: { type: MarkerType.ArrowClosed, color: phaseConfig.end.color, width: 16, height: 16 },
        data: {
          isActive: completedPhases.has("think") && currentPhase === "end" && running,
          color: phaseConfig.end.color,
          dashed: true,
        },
      });
    }

    return edgeList;
  }, [currentPhase, completedPhases, status, steps]);

  const proOptions = { hideAttribution: true };

  const fitView = useCallback(() => {}, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={proOptions}
        connectionLineComponent={ConnectionLine}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        onInit={fitView}
      >
        <Background color="#2c2c2e" gap={20} size={1} />
        <Controls
          className="!bg-surface-700 !border-surface-500 !rounded-lg"
          style={{ bottom: 0 }}
        />
      </ReactFlow>
    </div>
  );
}
