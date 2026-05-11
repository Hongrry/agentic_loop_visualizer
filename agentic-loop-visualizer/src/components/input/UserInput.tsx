import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRuntimeStore } from "@/store/runtimeStore";

const EXAMPLE_PROMPTS = [
  "帮我查询北京天气并给出穿衣建议",
  "搜索最新的 AI 新闻",
  "查询上海和东京的天气对比",
  "帮我搜索 React 19 的新特性",
];

export function UserInput() {
  const [localInput, setLocalInput] = useState("");

  const userInput = useRuntimeStore((s) => s.userInput);
  const setUserInput = useRuntimeStore((s) => s.setUserInput);
  const startLoop = useRuntimeStore((s) => s.startLoop);
  const reset = useRuntimeStore((s) => s.reset);
  const status = useRuntimeStore((s) => s.status);

  const isRunning = status === "running";

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const inputToUse = localInput.trim() || userInput.trim();
      if (!inputToUse || isRunning) return;

      setUserInput(inputToUse);
      setLocalInput("");
      await startLoop();
    },
    [localInput, userInput, isRunning, setUserInput, startLoop]
  );

  const handleExampleClick = useCallback(
    (prompt: string) => {
      if (isRunning) return;
      setLocalInput(prompt);
      setUserInput(prompt);
    },
    [isRunning, setUserInput]
  );

  const handleReset = useCallback(() => {
    setLocalInput("");
    reset();
  }, [reset]);

  const displayValue = localInput || userInput;

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="输入您的问题，例如：帮我查询北京天气并给出穿衣建议"
            value={displayValue}
            onChange={(e) => {
              setLocalInput(e.target.value);
              setUserInput(e.target.value);
            }}
            disabled={isRunning}
            className="pr-10 h-11 text-sm"
          />
          {isRunning && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 text-accent-400 animate-spin" />
            </div>
          )}
        </div>
        <Button
          type="submit"
          variant="accent"
          size="lg"
          disabled={isRunning || (!localInput.trim() && !userInput.trim())}
          className="shrink-0"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              运行中...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              运行
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={handleReset}
          disabled={isRunning}
          className="shrink-0"
        >
          重置
        </Button>
      </form>

      {(status === "idle" || status === "completed") && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-wrap gap-2"
        >
          <span className="flex items-center gap-1 text-xs text-white/35 mr-1">
            <Sparkles className="h-3 w-3" />
            示例:
          </span>
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleExampleClick(prompt)}
              className="text-xs text-white/45 hover:text-white/80 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/8 transition-all duration-300 ease-out"
            >
              {prompt.length > 24 ? prompt.slice(0, 24) + "..." : prompt}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
