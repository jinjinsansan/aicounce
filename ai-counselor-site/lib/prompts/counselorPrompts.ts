import { ADAM_SYSTEM_PROMPT } from "@/lib/team/prompts/adam";
import { GEMINI_SYSTEM_PROMPT } from "@/lib/team/prompts/gemini";
import { CLAUDE_SYSTEM_PROMPT } from "@/lib/team/prompts/claude";
import { DEEP_SYSTEM_PROMPT } from "@/lib/team/prompts/deep";
import { NAZARE_SYSTEM_PROMPT } from "@/lib/team/prompts/nazare";
import { SIDDHARTHA_SYSTEM_PROMPT } from "@/lib/team/prompts/siddhartha";
import { NANA_SYSTEM_PROMPT } from "@/lib/team/prompts/nana";
import { SAITO_SYSTEM_PROMPT } from "@/lib/team/prompts/saito";
import { DALE_SYSTEM_PROMPT } from "@/lib/team/prompts/dale";
import { MIRAI_SYSTEM_PROMPT } from "@/lib/team/prompts/mirai";
import { PINA_SYSTEM_PROMPT } from "@/lib/team/prompts/pina";
import { MUU_SYSTEM_PROMPT } from "@/lib/team/prompts/muu";
import { MITSU_SYSTEM_PROMPT } from "@/lib/team/prompts/mitsu";
import { YUKI_SYSTEM_PROMPT } from "@/lib/team/prompts/yuki";

export const COUNSELOR_SYSTEM_PROMPTS: Record<string, string> = {
  adam: ADAM_SYSTEM_PROMPT,
  gemini: GEMINI_SYSTEM_PROMPT,
  claude: CLAUDE_SYSTEM_PROMPT,
  deep: DEEP_SYSTEM_PROMPT,
  nazare: NAZARE_SYSTEM_PROMPT,
  siddhartha: SIDDHARTHA_SYSTEM_PROMPT,
  nana: NANA_SYSTEM_PROMPT,
  saito: SAITO_SYSTEM_PROMPT,
  dale: DALE_SYSTEM_PROMPT,
  mirai: MIRAI_SYSTEM_PROMPT,
  pina: PINA_SYSTEM_PROMPT,
  muu: MUU_SYSTEM_PROMPT,
  mitsu: MITSU_SYSTEM_PROMPT,
  yuki: YUKI_SYSTEM_PROMPT,
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
  SAITO_SYSTEM_PROMPT,
  DALE_SYSTEM_PROMPT,
  MIRAI_SYSTEM_PROMPT,
  PINA_SYSTEM_PROMPT,
  MUU_SYSTEM_PROMPT,
  MITSU_SYSTEM_PROMPT,
  YUKI_SYSTEM_PROMPT,
};
