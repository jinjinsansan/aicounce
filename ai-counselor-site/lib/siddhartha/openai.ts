import OpenAI from "openai";

import { siddharthaEnv } from "@/lib/siddhartha/env.server";

let siddharthaOpenAIClient: OpenAI | null = null;

export const getSiddharthaOpenAIClient = () => {
  if (!siddharthaEnv.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!siddharthaOpenAIClient) {
    siddharthaOpenAIClient = new OpenAI({ apiKey: siddharthaEnv.openAiApiKey });
  }

  return siddharthaOpenAIClient;
};

export const getSiddharthaAssistantId = () => siddharthaEnv.assistantId;
