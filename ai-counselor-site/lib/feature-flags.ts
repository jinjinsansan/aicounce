const toBool = (value: string | undefined) => (value ?? "true").toLowerCase() === "true";

export const MICHELLE_AI_ENABLED = toBool(process.env.MICHELLE_AI_ENABLED) &&
  Boolean(process.env.OPENAI_API_KEY && process.env.MICHELLE_ASSISTANT_ID);

export const CLINICAL_AI_ENABLED = toBool(process.env.CLINICAL_AI_ENABLED) &&
  Boolean(process.env.OPENAI_API_KEY && process.env.CLINICAL_ASSISTANT_ID);
