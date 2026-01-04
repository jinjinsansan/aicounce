import OpenAI from "openai";

import { clinicalEnv } from "@/lib/clinical/env.server";

let clinicalOpenAIClient: OpenAI | null = null;

export const getClinicalOpenAIClient = () => {
  if (!clinicalEnv.openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (!clinicalOpenAIClient) {
    clinicalOpenAIClient = new OpenAI({ apiKey: clinicalEnv.openAiApiKey });
  }

  return clinicalOpenAIClient;
};

export const getClinicalAssistantId = () => clinicalEnv.assistantId;
