import { ADAM_SYSTEM_PROMPT } from "@/lib/team/prompts/adam";
import { GEMINI_SYSTEM_PROMPT } from "@/lib/team/prompts/gemini";
import { CLAUDE_SYSTEM_PROMPT } from "@/lib/team/prompts/claude";
import { DEEP_SYSTEM_PROMPT } from "@/lib/team/prompts/deep";
import { NAZARE_SYSTEM_PROMPT } from "@/lib/team/prompts/nazare";
import { SIDDHARTHA_SYSTEM_PROMPT } from "@/lib/team/prompts/siddhartha";
import { NANA_SYSTEM_PROMPT } from "@/lib/team/prompts/nana";

export const COUNSELOR_SYSTEM_PROMPTS: Record<string, string> = {
  adam: ADAM_SYSTEM_PROMPT,
  gemini: GEMINI_SYSTEM_PROMPT,
  claude: CLAUDE_SYSTEM_PROMPT,
  deep: DEEP_SYSTEM_PROMPT,
  nazare: NAZARE_SYSTEM_PROMPT,
  siddhartha: SIDDHARTHA_SYSTEM_PROMPT,
  nana: NANA_SYSTEM_PROMPT,
};

export function getDefaultCounselorPrompt(counselorId: string | null | undefined) {
  if (!counselorId) return undefined;
  return COUNSELOR_SYSTEM_PROMPTS[counselorId.toLowerCase()];
}

export {
  ADAM_SYSTEM_PROMPT,
  GEMINI_SYSTEM_PROMPT,
  CLAUDE_SYSTEM_PROMPT,
  DEEP_SYSTEM_PROMPT,
  NAZARE_SYSTEM_PROMPT,
  SIDDHARTHA_SYSTEM_PROMPT,
  NANA_SYSTEM_PROMPT,
};
