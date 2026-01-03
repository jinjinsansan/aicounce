export const michelleEnv = {
  get openAiApiKey() {
    return process.env.OPENAI_API_KEY ?? "";
  },
  get assistantId() {
    return process.env.MICHELLE_ASSISTANT_ID ?? "";
  },
  get useSinrRag() {
    return (process.env.USE_SINR_RAG ?? "true").toLowerCase() === "true";
  },
  get phaseModel() {
    return process.env.MICHELLE_PHASE_MODEL ?? "gpt-4o-mini";
  },
};
