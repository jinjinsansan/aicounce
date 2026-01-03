import OpenAI from "openai";

import { michelleEnv } from "@/lib/michelle/env.server";

let michelleOpenAIClient: OpenAI | null = null;

export const getMichelleOpenAIClient = () => {
  if (!michelleEnv.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!michelleOpenAIClient) {
    michelleOpenAIClient = new OpenAI({ apiKey: michelleEnv.openAiApiKey });
  }

  return michelleOpenAIClient;
};

export const getMichelleAssistantId = () => michelleEnv.assistantId;
