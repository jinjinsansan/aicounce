import type { DiscussionStyleOption } from "@/types/discussion";

export const DISCUSSION_ROUND_OPTIONS = [3, 5, 10] as const;

export const DISCUSSION_STYLES: DiscussionStyleOption[] = [
  {
    value: "balanced",
    label: "バランス",
    description: "穏やかに相手の意見を受け止めつつ、論点を広げます。",
    role: "both",
  },
  {
    value: "contrarian",
    label: "反論役",
    description: "常に疑問を投げかけ、相手の前提を揺さぶります。",
    role: "debater",
  },
  {
    value: "passionate",
    label: "熱狂型",
    description: "感情豊かに、自説への情熱を前面に押し出します。",
    role: "debater",
  },
  {
    value: "aggressive",
    label: "マウント型",
    description: "挑発的に議論をリードし、相手にプレッシャーを与えます。",
    role: "debater",
  },
  {
    value: "moderator_calm",
    label: "冷静まとめ",
    description: "感情に流されず論点を整理して結論を導きます。",
    role: "moderator",
  },
  {
    value: "moderator_coach",
    label: "コーチング",
    description: "双方を励ましながら建設的なまとめを提示します。",
    role: "moderator",
  },
];

const STYLE_INSTRUCTIONS: Record<string, { debater?: string; moderator?: string }> = {
  balanced: {
    debater:
      "あなたは冷静でバランスの取れた議論者です。相手の論点を一度受け止めてから、自分の視点を落ち着いて提示してください。",
  },
  contrarian: {
    debater:
      "あなたは常に相手の前提や論理に疑問を投げかける反論役です。必ず一つは相手にとって不都合な問いを提示してください。",
  },
  passionate: {
    debater:
      "あなたは情熱的な語り口で議題への強い想いを語ります。比喩や感情のこもった言葉で読者の心を揺さぶってください。",
  },
  aggressive: {
    debater:
      "あなたは挑発的で勝気な議論スタイルです。相手の弱点を指摘し、主導権を握るために強い言葉も辞さないでください。ただし侮辱語は避けます。",
  },
  moderator_calm: {
    moderator:
      "あなたは中立的なモデレーターです。事実と論点を整理し、双方の主張を公平にまとめてください。",
  },
  moderator_coach: {
    moderator:
      "あなたは励まし役のモデレーターです。双方の建設的な点を強調し、次のアクションや共通解を示します。",
  },
};

const DEFAULT_DEBATER_STYLE =
  "あなたはスピーディーな議論のライブに参加しており、具体例と洞察を交えて短めに答えます。";
const DEFAULT_MODERATOR_STYLE =
  "あなたは議論のまとめ役です。感情的な言葉を落ち着かせ、論点と結論を整理します。";

export function getStyleInstruction(style: string | undefined, role: "debater" | "moderator") {
  const preset = STYLE_INSTRUCTIONS[style ?? ""];
  if (role === "moderator") {
    return preset?.moderator ?? DEFAULT_MODERATOR_STYLE;
  }
  return preset?.debater ?? DEFAULT_DEBATER_STYLE;
}
