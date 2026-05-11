import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
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

function getMostRecentStepOfPhase(steps: LoopStep[], phase: LoopPhase): LoopStep | undefined {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].phase === phase) return steps[i];
  }
  return undefined;
}

function getLastThinkWithToolCall(steps: LoopStep[]): LoopStep | undefined {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].phase === "think" && steps[i].transitionLabel?.startsWith("调用工具")) {
      return steps[i];
    }
  }
  return undefined;
}

function getLastThinkWithDirectAnswer(steps: LoopStep[]): LoopStep | undefined {
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].phase === "think" && steps[i].transitionLabel === "直接输出答案") {
      return steps[i];
    }
  }
  return undefined;
}

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

// Connection line rendered while user drags
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
    const nodeList: Node<PhaseNodeData>[] = [];
    const startY = 60;
    const gap = 130;

    phaseOrder.forEach((phase, index) => {
      nodeList.push({
        id: phase,
        type: "phaseNode",
        position: { x: 80, y: startY + index * gap },
        data: {
          phase,
          label: phase === "think" ? "思考" : phase === "act" ? "执行" : phase === "observe" ? "观察" : "结束",
          isActive: currentPhase === phase && (status === "running" || status === "completed" || status === "paused"),
          isCompleted: completedPhases.has(phase),
        },
      });
    });

    return nodeList;
  }, [currentPhase, completedPhases, status]);

  const edges: Edge<AnimatedEdgeData>[] = useMemo(() => {
    const edgeList: Edge<AnimatedEdgeData>[] = [];

    const thinkWithTool = getLastThinkWithToolCall(steps);
    const thinkWithAnswer = getLastThinkWithDirectAnswer(steps);
    const mostRecentObserve = getMostRecentStepOfPhase(steps, "observe");

    for (let i = 0; i < phaseOrder.length - 1; i++) {
      const source = phaseOrder[i];
      const target = phaseOrder[i + 1];
      const sourceConfig = phaseConfig[source];
      const isEdgeActive =
        completedPhases.has(source) &&
        (currentPhase === target || (completedPhases.has(target) && currentPhase !== "end"));

      let label: string | undefined;
      if (source === "think" && thinkWithTool) {
        label = thinkWithTool.transitionLabel;
      }

      edgeList.push({
        id: `e-${source}-${target}`,
        source,
        target,
        type: "animated",
        data: {
          isActive: isEdgeActive && status !== "idle",
          color: sourceConfig.color,
          label,
        },
      });
    }

    // Cycle edge from Observe back to Think (loop)
    const isLoopActive = completedPhases.has("observe") && (currentPhase === "think" || status === "running");

    edgeList.push({
      id: "e-observe-think-loop",
      source: "observe",
      target: "think",
      type: "animated",
      data: {
        isActive: isLoopActive,
        color: phaseConfig.think.color,
        label: mostRecentObserve?.transitionLabel,
      },
      style: { strokeDasharray: "6 4" },
    });

    // Think → End direct edge (no tool calls)
    const showThinkToEnd = hasDirectThinkToEnd(steps);
    if (showThinkToEnd) {
      const isThinkEndActive =
        completedPhases.has("think") && (currentPhase === "end" || status === "completed");

      edgeList.push({
        id: "e-think-end-direct",
        source: "think",
        target: "end",
        type: "animated",
        data: {
          isActive: isThinkEndActive && status !== "idle",
          color: phaseConfig.end.color,
          label: thinkWithAnswer?.transitionLabel,
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
