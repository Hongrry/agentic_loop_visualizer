import { useState, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRuntimeStore } from "@/store/runtimeStore";

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

  const handleReset = useCallback(() => {
    setLocalInput("");
    reset();
  }, [reset]);

  const displayValue = localInput || userInput;

  return (
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
          className="pr-10 h-9 text-sm"
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
        size="sm"
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
        size="sm"
        onClick={handleReset}
        disabled={isRunning}
        className="shrink-0"
      >
        重置
      </Button>
    </form>
  );
}
