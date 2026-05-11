import { create } from "zustand";
import type { LoopStep, RuntimeStatus } from "@/types/runtime";
import { runAgenticLoop } from "@/api/agentLoop";

let playbackInterval: ReturnType<typeof setInterval> | null = null;

type RuntimeState = {
  steps: LoopStep[];
  currentStepIndex: number;
  status: RuntimeStatus;
  playing: boolean;
  speed: number;
  error: string | null;
  userInput: string;

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

  setUserInput: (input: string) => {
    set({ userInput: input });
  },

  startLoop: async () => {
    const { userInput, steps } = get();

    if (!userInput.trim()) {
      set({ error: "请输入您的问题。" });
      return;
    }

    set({ status: "running", error: null, steps: [], currentStepIndex: -1 });

    try {
      const allSteps: LoopStep[] = [];
      await runAgenticLoop(userInput, (step: LoopStep) => {
        const existingIndex = allSteps.findIndex((s) => s.id === step.id);
        if (existingIndex >= 0) {
          allSteps[existingIndex] = step;
        } else {
          allSteps.push(step);
        }
        set({
          steps: [...allSteps],
          currentStepIndex: allSteps.length - 1,
        });
      });
      set({ status: "completed", playing: false });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "运行时发生未知错误";
      set({
        status: "error",
        error: errorMsg,
        playing: false,
        steps: get().steps.length === 0 ? steps : get().steps,
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
    });
  },
}));
