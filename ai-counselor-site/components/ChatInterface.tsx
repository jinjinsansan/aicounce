"use client";

import { useCallback, type ChangeEvent } from "react";
import { useChatStore } from "@/store/chatStore";

interface ChatInterfaceProps {
  counselorId: string;
  conversationId?: string | null;
  onConversationResolved?: (conversationId: string) => void;
}

export default function ChatInterface({
  counselorId,
  conversationId,
  onConversationResolved,
}: ChatInterfaceProps) {
  const { input, setInput, isSending, sendMessage } = useChatStore();

  const handleSubmit = useCallback(async () => {
    const newConversationId = await sendMessage({
      counselorId,
      conversationId,
    });

    if (
      newConversationId &&
      newConversationId !== conversationId &&
      onConversationResolved
    ) {
      onConversationResolved(newConversationId);
    }
  }, [conversationId, counselorId, onConversationResolved, sendMessage]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
    },
    [setInput],
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <textarea
          value={input}
          onChange={handleInputChange}
          placeholder="今の気持ちや相談内容を入力してください..."
          className="min-h-[64px] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSending || !input.trim()}
          className="h-12 min-w-[120px] rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSending ? "送信中..." : "送信"}
        </button>
      </div>
    </div>
  );
}
