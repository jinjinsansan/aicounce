"use client";

export type GuidedPhase = "explore" | "deepen" | "release";

export type GuidedActionPreset = {
  id: string;
  label: string;
  prompt: string;
  success?: string;
  loadingLabel?: string;
};

export type PhaseDetail = {
  title: string;
  summary: string;
  cta: string;
};

export const DEFAULT_GUIDED_ACTIONS: GuidedActionPreset[] = [
  {
    id: "back",
    label: "↺ 振り返り",
    prompt:
      "直前に扱っていたテーマをもう一度整理したいです。さっきの内容を別の視点でもう少し丁寧に解説してください。",
    success: "✓ 直前のテーマを振り返ります",
    loadingLabel: "準備中...",
  },
  {
    id: "deeper",
    label: "◎ 深掘り",
    prompt:
      "今取り組んでいる心のテーマをさらに深掘りしたいです。感情の芯や根底にある思い込みまで一緒に探ってください。",
    success: "✓ さらに深掘ります",
    loadingLabel: "考え中...",
  },
  {
    id: "next",
    label: "次へ ▶",
    prompt: "このテーマはいったん区切って、次に進むためのセルフケアや新しい視点を案内してください。",
    success: "✓ 次のステップへ",
    loadingLabel: "案内中...",
  },
];

export const DEFAULT_PHASE_LABELS: Record<GuidedPhase, string> = {
  explore: "気持ちの整理",
  deepen: "深掘り",
  release: "リリース＆ケア",
};

export const DEFAULT_PHASE_HINTS: Record<GuidedPhase, string> = {
  explore: "安心して気持ちを言葉にしていきましょう",
  deepen: "核心に近づいています。ゆっくり振り返りましょう",
  release: "次の一歩とセルフケアを一緒に整えましょう",
};

export const DEFAULT_PHASE_DETAILS: Record<GuidedPhase, PhaseDetail> = {
  explore: {
    title: "土台を整えるフェーズ",
    summary: "まずは頭の中を安全に言語化する時間です。浮かんだことをそのまま書き出すだけで、緊張や混乱がほどけやすくなります。",
    cta: "感じたことを率直に共有",
  },
  deepen: {
    title: "深層を見つめるフェーズ",
    summary: "テーマの核心や背景感情を一緒に探る段階です。繰り返し出てくる思考パターンや身体感覚にも目を向けると、気づきが加速します。",
    cta: "気づいた変化を伝える",
  },
  release: {
    title: "次の一歩を整えるフェーズ",
    summary: "十分に見つめた後は、セルフケアや具体的なアクションを決めて日常へ戻る準備です。小さなチャレンジを決めるだけでも十分です。",
    cta: "合図になる一歩を考える",
  },
};

export function inferGuidedPhase(userMessageCount: number): GuidedPhase {
  if (userMessageCount < 4) {
    return "explore";
  }
  if (userMessageCount < 8) {
    return "deepen";
  }
  return "release";
}

export function getPhaseProgress(userMessageCount: number): number {
  const progress = userMessageCount / 12;
  return Math.max(0, Math.min(progress, 1));
}
