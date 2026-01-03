"use client";

import { create } from "zustand";
import type { Message } from "@/types";

type ChatState = {
  messages: Message[];
  input: string;
  isSending: boolean;
  setInput: (value: string) => void;
  setMessages: (messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  sendMessage: (payload: {
    counselorId: string;
    conversationId: string;
  }) => Promise<void>;
};

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const createMessage = (
  role: Message["role"],
  content: string,
  conversationId: string,
): Message => ({
  id: generateId(),
  role,
  content,
  conversationId,
  createdAt: new Date().toISOString(),
});

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  input: "",
  isSending: false,
  setInput: (value) => set({ input: value }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) => set({ messages: [...get().messages, message] }),
  sendMessage: async ({ counselorId, conversationId }) => {
    const { input } = get();
    if (!input.trim() || get().isSending) return;

    const userContent = input.trim();
    set({
      isSending: true,
      input: "",
    });

    const userMessage = createMessage("user", userContent, conversationId);
    get().appendMessage(userMessage);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId,
          conversationId,
          message: userContent,
        }),
      });

      const data = await response.json();

      const assistantMessage = createMessage(
        "assistant",
        data?.content ?? "応答を取得できませんでした。",
        conversationId,
      );

      get().appendMessage(assistantMessage);
    } catch (error) {
      console.error("Failed to send message", error);
      get().appendMessage(
        createMessage(
          "assistant",
          "エラーが発生しました。時間をおいて再度お試しください。",
          conversationId,
        ),
      );
    } finally {
      set({ isSending: false });
    }
  },
}));
