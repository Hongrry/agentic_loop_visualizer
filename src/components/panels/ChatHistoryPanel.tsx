import { useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, User, Bot, Wrench } from "lucide-react";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { useRuntimeStore } from "@/store/runtimeStore";

type ChatMessage = {
  role: string;
  content: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
  reasoning_content?: string;
};

function AssistantBubble({ msg }: { msg: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex gap-2"
    >
      <div className="shrink-0 h-6 w-6 rounded-full bg-accent-500/15 flex items-center justify-center">
        <Bot className="h-3 w-3 text-accent-400" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {msg.reasoning_content && (
          <div className="rounded-lg bg-glow-cyan/5 p-2.5 text-xs text-glow-cyan/60 border border-glow-cyan/10 italic">
            {msg.reasoning_content}
          </div>
        )}
        {msg.content && (
          <div className="rounded-lg bg-white/[0.04] p-2.5 text-xs text-white/70 border border-white/5">
            <MarkdownContent>{msg.content}</MarkdownContent>
          </div>
        )}
        {msg.tool_calls && msg.tool_calls.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-glow-amber">
            <Wrench className="h-3 w-3" />
            {(msg.tool_calls as Array<{ function?: { name?: string } }>)
              .map((tc) => tc.function?.name ?? "unknown")
              .join(", ")}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UserBubble({ msg }: { msg: ChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex justify-end gap-2"
    >
      <div className="max-w-[85%] rounded-lg bg-accent-500/10 p-2.5 text-xs text-white/80 border border-accent-500/15">
        {msg.content}
      </div>
      <div className="shrink-0 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
        <User className="h-3 w-3 text-white/50" />
      </div>
    </motion.div>
  );
}

function ToolBubble({ msg }: { msg: ChatMessage }) {
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(msg.content);
  } catch {
    // not JSON
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex gap-2 pl-8"
    >
      <div className="flex-1 rounded-lg bg-glow-green/5 p-2 text-[10px] text-glow-green/60 font-mono border border-glow-green/10 truncate">
        {parsed ? JSON.stringify(parsed).slice(0, 120) : msg.content.slice(0, 120)}
      </div>
    </motion.div>
  );
}

export function ChatHistoryPanel() {
  const messages = useRuntimeStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          <MessageCircle className="h-3.5 w-3.5 text-white/35" />
          <span className="text-xs font-semibold text-white/35 uppercase tracking-wider">对话记录</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-white/25 text-center leading-relaxed px-4">
            运行智能体后将在此显示对话记录
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        <MessageCircle className="h-3.5 w-3.5 text-white/35" />
        <span className="text-xs font-semibold text-white/35 uppercase tracking-wider">
          对话记录 ({messages.length})
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          <AnimatePresence>
            {messages.map((msg, i) => {
              if (msg.role === "user") return <UserBubble key={i} msg={msg} />;
              if (msg.role === "assistant") return <AssistantBubble key={i} msg={msg} />;
              if (msg.role === "tool") return <ToolBubble key={i} msg={msg} />;
              return null;
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
