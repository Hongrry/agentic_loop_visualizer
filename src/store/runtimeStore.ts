import { create } from "zustand";
import type { LoopStep, RuntimeStatus, RuntimeError } from "@/types/runtime";
import { runAgenticLoop } from "@/api/agentLoop";
import type { LoopResult } from "@/api/agentLoop";

let playbackInterval: ReturnType<typeof setInterval> | null = null;

function startPlaybackInterval() {
  const store = useRuntimeStore;
  store.setState({ playing: true });
  playbackInterval = setInterval(() => {
    const state = store.getState();
    if (!state.playing) {
      clearInterval(playbackInterval!);
      playbackInterval = null;
      return;
    }
    if (state.currentStepIndex < state.steps.length - 1) {
      store.setState({ currentStepIndex: state.currentStepIndex + 1 });
    } else {
      store.setState({ playing: false });
      clearInterval(playbackInterval!);
      playbackInterval = null;
    }
  }, 1000 / store.getState().speed);
}

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
  error: RuntimeError | null;
  userInput: string;
  messages: ChatMessage[];
  abortController: AbortController | null;

  setUserInput: (input: string) => void;
  startLoop: () => Promise<void>;
  cancel: () => void;
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
  abortController: null,

  setUserInput: (input: string) => {
    set({ userInput: input });
  },

  startLoop: async () => {
    const { userInput, steps: existingSteps, messages: existingMessages, abortController: prevAc } = get();
    prevAc?.abort();

    if (!userInput.trim()) {
      set({ error: { code: "unknown", message: "请输入您的问题。", retryable: false } });
      return;
    }

    const ac = new AbortController();
    set({ status: "running", error: null, currentStepIndex: existingSteps.length - 1, abortController: ac });

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
        existingMessages.length > 0 ? existingMessages : undefined,
        ac.signal
      );

      if (result.error?.code === "abort") {
        set({ status: "idle", playing: false, abortController: null });
        return;
      }

      const mergedSteps = [...existingSteps, ...result.steps];
      set({
        steps: mergedSteps,
        currentStepIndex: mergedSteps.length - 1,
        messages: result.messages,
        status: result.error ? "error" : "completed",
        error: result.error ?? null,
        playing: false,
        abortController: null,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ status: "idle", playing: false, abortController: null });
        return;
      }
      set({
        status: "error",
        error: { code: "unknown", message: err instanceof Error ? err.message : "运行时发生未知错误", retryable: true },
        playing: false,
        abortController: null,
      });
    }
  },

  cancel: () => {
    const { abortController } = get();
    abortController?.abort();
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
    set({ status: "idle", playing: false, abortController: null });
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
    get().pause();
    const { steps } = get();
    if (get().currentStepIndex >= steps.length - 1) {
      set({ currentStepIndex: 0 });
    }
    startPlaybackInterval();
  },

  pause: () => {
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
    set({ playing: false });
  },

  replay: () => {
    get().pause();
    set({ currentStepIndex: 0 });
    startPlaybackInterval();
  },

  reset: () => {
    get().abortController?.abort();
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
      abortController: null,
    });
  },
}));
