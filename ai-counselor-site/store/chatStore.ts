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
    conversationId?: string | null;
  }) => Promise<string | null>;
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
    if (!input.trim() || get().isSending) return conversationId ?? null;

    const userContent = input.trim();
    set({
      isSending: true,
      input: "",
    });

    const optimisticConversationId = conversationId ?? "pending";
    const userMessage = createMessage("user", userContent, optimisticConversationId);
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

      if (response.status === 401) {
        get().appendMessage(
          createMessage(
            "assistant",
            "ログインが必要です。再度サインインしてください。",
            optimisticConversationId,
          ),
        );
        return conversationId ?? null;
      }

      const data = await response.json();

      const resolvedConversationId = data?.conversationId ?? conversationId ?? null;

      if (resolvedConversationId && resolvedConversationId !== optimisticConversationId) {
        set({
          messages: get().messages.map((msg) => ({
            ...msg,
            conversationId: resolvedConversationId,
          })),
        });
      }

      const assistantMessage = createMessage(
        "assistant",
        data?.content ?? "応答を取得できませんでした。",
        resolvedConversationId ?? optimisticConversationId,
      );

      get().appendMessage(assistantMessage);
      return resolvedConversationId;
    } catch (error) {
      console.error("Failed to send message", error);
      get().appendMessage(
        createMessage(
          "assistant",
          "エラーが発生しました。時間をおいて再度お試しください。",
          conversationId ?? optimisticConversationId,
        ),
      );
      return conversationId ?? null;
    } finally {
      set({ isSending: false });
    }
  },
}));
