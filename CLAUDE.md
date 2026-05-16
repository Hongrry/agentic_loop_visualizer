# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Agentic Loop Visualizer — a React SPA that visualizes AI Agent Runtime (ReAct Loop: Think → Act → Observe → End). It connects to OpenAI-compatible APIs with function calling, runs a real agentic loop, and displays the runtime state machine as an animated node graph with step details, decision trail, and timeline playback.

## Commands

```bash
npm run dev       # Vite dev server (HMR)
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm run preview   # Vite preview
```

## Environment

Copy `.env.example` to `.env` and configure:

```
VITE_OPENAI_API_KEY=sk-xxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_OPENAI_MODEL=gpt-4o
```

Supports any OpenAI-compatible API (Azure, Ollama, etc.) via `VITE_OPENAI_BASE_URL`.

## Architecture

```
src/
├── types/runtime.ts       # Core types: LoopPhase, LoopStep, RuntimeStatus, ApiRequest/Response, StreamChunk
├── store/runtimeStore.ts  # Zustand store — all runtime state + playback controls (play/pause/next/prev/replay/reset)
├── api/
│   ├── agentLoop.ts       # Agentic loop engine: orchestrates Think→Act→Observe→End, calls OpenAI + tools, streams steps to store
│   ├── openai.ts          # OpenAI API client: non-streaming callOpenAI, streaming callOpenAIStream, message builders
│   └── tools.ts           # Tool definitions (get_weather, search_web) + local simulated tool execution
├── components/
│   ├── loop/
│   │   ├── LoopGraph.tsx       # React Flow graph — 4 nodes (think/act/observe/end) in triangle layout with animated edges
│   │   ├── PhaseNode.tsx       # Custom React Flow node with glow/pulse animation per phase
│   │   ├── AnimatedEdge.tsx    # Animated SVG edge with flow animation
│   │   └── phaseConfig.ts      # Per-phase colors, icons, and labels
│   ├── panels/
│   │   ├── StepDetailPanel.tsx     # Right panel — phase-specific detail (Think: goal/decision/thought; Act: tool IO; Observe: context diff; End: final answer)
│   │   ├── DecisionTrail.tsx       # Left panel — rounds grouped by loopRound, click to open DecisionDetailDrawer
│   │   └── DecisionDetailDrawer.tsx # Modal drawer for drilling into a specific round's decision details
│   ├── timeline/
│   │   └── TimelinePlayer.tsx  # Bottom bar — step dots with play/pause/prev/next/replay/reset controls
│   ├── input/
│   │   └── UserInput.tsx       # Top input bar
│   └── ui/                     # Reusable primitives (badge, button, card, input, select, MarkdownContent)
└── App.tsx                     # Root layout: header (title + UserInput + API status) → 3-col body (DecisionTrail | LoopGraph | StepDetailPanel) → TimelinePlayer footer
```

### Data flow

1. User types question → `UserInput` calls `store.setUserInput()`
2. User clicks run → `store.startLoop()` calls `runAgenticLoop()` from `api/agentLoop.ts`
3. `agentLoop.ts` runs the ReAct loop: calls OpenAI streaming API → receives response → if tool_calls, executes tools locally → feeds tool results back as messages → repeats until `finish_reason=stop`
4. Each step (think/act/observe/end) is pushed to the Zustand store via callback, updating `steps[]` and `currentStepIndex` in real time
5. All components read from the same Zustand store — `LoopGraph` renders node states, `StepDetailPanel` renders current step details, `DecisionTrail` groups steps by round, `TimelinePlayer` shows step dots

### State management

Single Zustand store (`useRuntimeStore`) holds: `steps[]`, `currentStepIndex`, `status`, `playing`, `speed`, `error`, `userInput`, `messages[]`. Playback uses `setInterval` with speed control. Multi-turn conversations are supported — `messages[]` is saved between `startLoop()` calls.

### Streaming

`callOpenAIStream()` in `openai.ts` uses `fetch` with `ReadableStream` to process SSE chunks. It accumulates content, reasoning_content, and tool_calls (which arrive incrementally across chunks per OpenAI's streaming tool call protocol). Each chunk fires `onChunk` which updates the think step in the store in real time.

### Styling

TailwindCSS 4 with custom dark theme tokens (`surface-*`, `glow-*`, `accent-*`). Components use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for class merging. Framer Motion for animations. "Deep tech runtime" visual style — dark backgrounds, glassmorphism, glow effects.

## Trellis workflow

This project is managed by Trellis. See `.trellis/workflow.md` for the full development workflow. The task system uses `python ./.trellis/scripts/task.py` for lifecycle management. Spec guidelines live under `.trellis/spec/`. Active tasks are under `.trellis/tasks/`.
