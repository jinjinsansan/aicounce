export const clinicalEnv = {
  get openAiApiKey() {
    return process.env.OPENAI_API_KEY ?? "";
  },
  get assistantId() {
    return process.env.CLINICAL_ASSISTANT_ID ?? "";
  },
  get phaseModel() {
    return process.env.CLINICAL_PHASE_MODEL ?? "gpt-4o-mini";
  },
};
