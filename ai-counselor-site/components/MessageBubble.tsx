"use client";

import { memo, useMemo } from "react";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
}

function MessageBubbleComponent({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const timestamp = useMemo(
    () =>
      new Date(message.createdAt).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [message.createdAt],
  );

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-lg rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-white/90 text-slate-900 border border-slate-100",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <span
          className={cn(
            "mt-2 block text-[11px]",
            isUser ? "text-white/80" : "text-slate-500",
          )}
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
}

export default memo(MessageBubbleComponent);
