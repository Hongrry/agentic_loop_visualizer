import { useState, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useRuntimeStore } from "@/store/runtimeStore";

const EXAMPLES = [
  { label: "示例问题", value: "" },
  { label: "查询北京天气", value: "帮我查询北京天气并给出穿衣建议" },
  { label: "分析特斯拉股票", value: "分析特斯拉股票当前是否值得投资" },
  { label: "规划杭州旅游行程", value: "帮我规划一个三天两夜的杭州旅游行程" },
  { label: "比较手机优缺点", value: "比较一下iPhone 16和华为Mate 70的优缺点" },
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

  const handleReset = useCallback(() => {
    setLocalInput("");
    reset();
  }, [reset]);

  const handleExampleSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (!value) return;
      setLocalInput(value);
      setUserInput(value);
    },
    [setUserInput]
  );

  const displayValue = localInput || userInput;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Select
        defaultValue=""
        onChange={handleExampleSelect}
        disabled={isRunning}
        className="w-[130px] shrink-0 h-9 text-xs"
      >
        {EXAMPLES.map((ex) => (
          <option key={ex.value} value={ex.value} className="text-surface-900">
            {ex.label}
          </option>
        ))}
      </Select>
      <div className="relative flex-1">
        <Input
          placeholder="输入您的问题"
          value={displayValue}
          onChange={(e) => {
            setLocalInput(e.target.value);
            setUserInput(e.target.value);
          }}
          disabled={isRunning}
          className="pr-10 h-9 text-sm"
        />
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
