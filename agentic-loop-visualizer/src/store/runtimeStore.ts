import { create } from "zustand";
import type { LoopStep, RuntimeStatus } from "@/types/runtime";
import { runAgenticLoop } from "@/api/agentLoop";
import type { LoopResult } from "@/api/agentLoop";

let playbackInterval: ReturnType<typeof setInterval> | null = null;

type ChatMessage = {
  role: string;
  content: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
  reasoning_content?: string;
};

type RuntimeState = {
  steps: LoopStep[];
  currentStepIndex: number;
  status: RuntimeStatus;
  playing: boolean;
  speed: number;
  error: string | null;
  userInput: string;
  messages: ChatMessage[];

  setUserInput: (input: string) => void;
  startLoop: () => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  play: () => void;
  pause: () => void;
  replay: () => void;
  reset: () => void;
};

export const useRuntimeStore = create<RuntimeState>((set, get) => ({
  steps: [],
  currentStepIndex: -1,
  status: "idle",
  playing: false,
  speed: 1,
  error: null,
  userInput: "",
  messages: [],

  setUserInput: (input: string) => {
    set({ userInput: input });
  },

  startLoop: async () => {
    const { userInput, steps: existingSteps, messages: existingMessages } = get();

    if (!userInput.trim()) {
      set({ error: "请输入您的问题。" });
      return;
    }

    set({ status: "running", error: null, currentStepIndex: existingSteps.length - 1 });

    try {
      const turnSteps: LoopStep[] = [];
      const result: LoopResult = await runAgenticLoop(
        userInput,
        (step: LoopStep) => {
          const existingIndex = turnSteps.findIndex((s) => s.id === step.id);
          if (existingIndex >= 0) {
            turnSteps[existingIndex] = step;
          } else {
            turnSteps.push(step);
          }
          const mergedSteps = [...existingSteps, ...turnSteps];
          set({
            steps: mergedSteps,
            currentStepIndex: mergedSteps.length - 1,
          });
        },
        existingMessages.length > 0 ? existingMessages : undefined
      );
      // Use the final merged steps from result and save messages for next turn
      const mergedSteps = [...existingSteps, ...result.steps];
      set({
        steps: mergedSteps,
        currentStepIndex: mergedSteps.length - 1,
        messages: result.messages,
        status: "completed",
        playing: false,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "运行时发生未知错误";
      set({
        status: "error",
        error: errorMsg,
        playing: false,
      });
    }
  },

  nextStep: () => {
    const { steps, currentStepIndex } = get();
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  previousStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  play: () => {
    if (playbackInterval) clearInterval(playbackInterval);
    const { steps, speed } = get();
    if (get().currentStepIndex >= steps.length - 1) {
      set({ currentStepIndex: 0 });
    }
    set({ playing: true });
    playbackInterval = setInterval(() => {
      const state = get();
      if (!state.playing) {
        clearInterval(playbackInterval!);
        playbackInterval = null;
        return;
      }
      if (state.currentStepIndex < state.steps.length - 1) {
        set({ currentStepIndex: state.currentStepIndex + 1 });
      } else {
        set({ playing: false });
        clearInterval(playbackInterval!);
        playbackInterval = null;
      }
    }, 1000 / speed);
  },

  pause: () => {
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
    set({ playing: false });
  },

  replay: () => {
    if (playbackInterval) clearInterval(playbackInterval);
    set({ currentStepIndex: 0, playing: true });
    const { speed } = get();
    playbackInterval = setInterval(() => {
      const state = get();
      if (!state.playing) {
        clearInterval(playbackInterval!);
        playbackInterval = null;
        return;
      }
      if (state.currentStepIndex < state.steps.length - 1) {
        set({ currentStepIndex: state.currentStepIndex + 1 });
      } else {
        set({ playing: false });
        clearInterval(playbackInterval!);
        playbackInterval = null;
      }
    }, 1000 / speed);
  },

  reset: () => {
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
    set({
      steps: [],
      currentStepIndex: -1,
      status: "idle",
      playing: false,
      error: null,
      userInput: "",
      messages: [],
    });
  },
}));
