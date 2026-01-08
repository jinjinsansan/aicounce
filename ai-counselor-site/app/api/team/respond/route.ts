import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FALLBACK_COUNSELORS } from "@/lib/constants/counselors";
import { searchRagContext } from "@/lib/rag";
import { MICHELLE_SYSTEM_PROMPT } from "@/lib/team/prompts/michelle";
import { SATO_SYSTEM_PROMPT } from "@/lib/team/prompts/sato";
import { ADAM_SYSTEM_PROMPT } from "@/lib/team/prompts/adam";
import { GEMINI_SYSTEM_PROMPT } from "@/lib/team/prompts/gemini";
import { CLAUDE_SYSTEM_PROMPT } from "@/lib/team/prompts/claude";
import { DEEP_SYSTEM_PROMPT } from "@/lib/team/prompts/deep";
import { NAZARE_SYSTEM_PROMPT } from "@/lib/team/prompts/nazare";
import { SIDDHARTHA_SYSTEM_PROMPT } from "@/lib/team/prompts/siddhartha";
import { SAITO_SYSTEM_PROMPT } from "@/lib/team/prompts/saito";
import { DALE_SYSTEM_PROMPT } from "@/lib/team/prompts/dale";
import { MIRAI_SYSTEM_PROMPT } from "@/lib/team/prompts/mirai";
import { PINA_SYSTEM_PROMPT } from "@/lib/team/prompts/pina";
import { YUKI_SYSTEM_PROMPT } from "@/lib/team/prompts/yuki";
import { MITSU_SYSTEM_PROMPT } from "@/lib/team/prompts/mitsu";
import { MUU_SYSTEM_PROMPT } from "@/lib/team/prompts/muu";
import { KENJI_SYSTEM_PROMPT } from "@/lib/team/prompts/kenji";
import { HOSHI_SYSTEM_PROMPT } from "@/lib/team/prompts/hoshi";
import { callLLMWithHistory, type ChatMessage } from "@/lib/llm";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { assertAccess, parseAccessError } from "@/lib/access-control";

type Participant = {
  id: string;
  name: string;
  iconUrl: string;
  ragEnabled: boolean;
  systemPrompt: string;
  specializationName: string;
  specializationTerms: string[];
  provider: "openai" | "gemini" | "claude" | "deepseek";
  model: string;
  specialty?: string;
  description?: string;
};

type Specialization = {
  name: string;
  terms: string[];
  systemPrompt: string;
  negativeInstruction: string;
  provider: "openai" | "gemini" | "claude" | "deepseek";
  model: string;
};

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
  author?: string;
  authorId?: string;
};

function sanitizeContent(raw: string, author?: string) {
  const text = raw.trim();
  if (!author) return text;
  const patterns = [
    new RegExp(`^\\[?${author}\\]?[:：]?\\s*`),
    new RegExp(`^${author}カウンセラー[:：]?\\s*`, 'i'),
    new RegExp(`^${author}[:：]?\\s*`),
  ];
  for (const p of patterns) {
    const cleaned = text.replace(p, "").trim();
    if (cleaned !== text) return cleaned;
  }
  return text;
}

function normalizeForMatch(value?: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[、。！？!?:：\-–—…「」『』（）()【】\[\]<>]/g, "");
}

function extractRagSnippet(ragContext?: string, maxLen = 90) {
  const raw = String(ragContext ?? "");
  const cleaned = raw
    .replace(/\[ソース\s*\d+\][^\n]*\n/g, "")
    .replace(/\(score:[^)]+\)/g, "")
    .replace(/^#+\s+.*$/gmu, "")
    .replace(/^##\s*キーワード.*$/gmu, "")
    .replace(/^\s*キーワード\s*[:：].*$/gmu, "")
    .trim();

  const first = cleaned
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)[0];

  return (first ?? "").slice(0, maxLen);
}

function cleanRagText(ragContext?: string) {
  const raw = String(ragContext ?? "");
  return raw
    .replace(/\[ソース\s*\d+\][^\n]*\n/g, "")
    .replace(/\(score:[^)]+\)/g, "")
    .replace(/^#+\s+.*$/gmu, "")
    .replace(/^##\s*キーワード.*$/gmu, "")
    .replace(/^\s*キーワード\s*[:：].*$/gmu, "")
    .trim();
}

function extractQuotedPhrases(output: string) {
  return Array.from(output.matchAll(/『([^』]{6,})』/g)).map((m) => m[1]);
}

function cleanRagSnippetForQuote(value: string) {
  return String(value)
    .replace(/^\s*\d+\.\s*/g, "")
    .replace(/^\s*[-•・]+\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/[`]/g, "")
    .replace(/[\s\u3000]+/g, " ")
    .trim();
}

function pickRagSnippetAvoidingRepeat(params: {
  ragContext?: string;
  maxLen?: number;
  avoidQuotes?: Array<string | null | undefined> | null;
}) {
  const { ragContext, maxLen = 90, avoidQuotes } = params;
  const raw = String(ragContext ?? "");
  if (!raw.trim()) return "";

  const candidates = raw
    .replace(/\[ソース\s*\d+\][^\n]*\n/g, "")
    .replace(/\(score:[^)]+\)/g, "")
    .replace(/^#+\s+.*$/gmu, "")
    .replace(/^##\s*キーワード.*$/gmu, "")
    .replace(/^\s*キーワード\s*[:：].*$/gmu, "")
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const cleanedCandidates = candidates
    .map((c) => cleanRagSnippetForQuote(c))
    .filter((c) => c.length >= 10);

  const avoidNorms = new Set(
    (avoidQuotes ?? [])
      .filter((q): q is string => typeof q === "string" && q.length > 0)
      .map((q) => normalizeForMatch(cleanRagSnippetForQuote(q)).slice(0, 18))
      .filter(Boolean),
  );
  const pickFrom = cleanedCandidates.length > 0 ? cleanedCandidates : candidates.map((c) => cleanRagSnippetForQuote(c));

  const notRepeat = (c: string) => {
    if (avoidNorms.size === 0) return true;
    const candNorm = normalizeForMatch(c).slice(0, 18);
    return candNorm && !avoidNorms.has(candNorm);
  };

  const sentenceLike = pickFrom.filter((c) => /[。！？?!]/.test(c));
  const picked = sentenceLike.find(notRepeat) ?? pickFrom.find(notRepeat) ?? pickFrom[0] ?? "";

  return String(picked).slice(0, maxLen);
}

function seemsToUseRagByQuote(output: string, ragContext?: string) {
  if (!ragContext?.trim()) return true;
  const ragNorm = normalizeForMatch(cleanRagText(ragContext));
  if (!ragNorm) return true;

  const quoted = extractQuotedPhrases(output)
    .map((q) => normalizeForMatch(cleanRagSnippetForQuote(q)))
    .filter((q) => q.length >= 10);

  if (quoted.length === 0) return false;
  return quoted.some((q) => ragNorm.includes(q.slice(0, 16)));
}

function buildForcedRagReplyNana(params: {
  scopedHistory: HistoryMessage[];
  snippet: string;
}) {
  const { scopedHistory, snippet } = params;
  const recentUserText = scopedHistory
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-3)
    .map((m) => m.content.trim())
    .join(" / ")
    .slice(0, 160);

  const quote = cleanRagSnippetForQuote(snippet);
  return [
    `『${quote}』`,
    "いまは不安が強いと思います。仕事の問題だけで抱え込まず、生活全体（睡眠・食事・相談先など）の土台も同時に整えると、持ち直しやすくなります。",
    recentUserText ? `（状況：${recentUserText}）` : "",
    "いま一番しんどいのは『評価』と『今後の対応』のどちらですか？",
  ]
    .filter(Boolean)
    .join("\n");
}

const KENJI_FORBIDDEN_PHRASES = [
  /雨ニモマケズ/,
  /南に死にそうな人あれば/,
  /東に病気の子供あれば/,
  /西に疲れた母あれば/,
  /北に喧嘩や訴訟があれば/,
  /今日から一つだけ、人の痛みに寄り添う/,
  /いつも静かに笑っていましょう/,
] as const;

function containsKenjiForbidden(text: string) {
  return KENJI_FORBIDDEN_PHRASES.some((re) => re.test(text));
}

function hasKenjiAnchor(text: string) {
  return /(ジョバンニ|カムパネルラ|ほんとうのさいわい|銀河鉄道)/.test(text);
}

function buildRagContextFromSources(sources: { chunk_text: string; similarity?: number }[]) {
  return sources
    .map(
      (chunk, index) =>
        `[ソース ${index + 1}] (score: ${(chunk.similarity ?? 0).toFixed(2)})\n${chunk.chunk_text}`,
    )
    .join("\n\n");
}

function buildForcedInterviewReply(params: {
  counselorId: "mitsu" | "kenji" | "mirai";
  stage: 1 | 2;
  scopedHistory: HistoryMessage[];
}) {
  const { counselorId, stage, scopedHistory } = params;
  const recentUserFacts = scopedHistory
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-2)
    .map((m) => m.content.trim())
    .join(" / ")
    .slice(0, 120);

  const t = recentUserFacts;
  const summary =
    counselorId === "mitsu"
      ? stage === 2 && /言い方/.test(t)
        ? "叱られた言い方がきつかったんだね。"
        : "上司に𠮟られて胸が苦しいんだね。"
      : recentUserFacts
        ? `いまは「${recentUserFacts}」のことで胸が苦しいんだね。`
        : "いま胸が苦しいんだね。";

  if (counselorId === "mirai") {
    if (stage === 1) {
      return `${summary}\n何がきっかけで𠮟られたのか、教えてくれる？`;
    }
    return `${summary}\nいちばん苦しいのは、叱られた言い方？ミスの不安？クビの不安？`;
  }

  if (counselorId === "mitsu") {
    if (stage === 1) {
      return `${summary}\n叱られたのは何について？（注文/対応/態度/遅れのどれ？）`;
    }
    return `${summary}\nいちばん苦しいのは、叱られた言い方？ミスの罪悪感？クビの不安？`;
  }

  if (stage === 1) {
    return `${summary}\nどの場面で、どんなふうに叱られたの？`;
  }
  return `${summary}\nいちばん苦しいのは、どんな気持ち？`;
}

const MITSU_ANCHORS = [
  /相田みつを/,
  /にんげんだもの/,
  /つまづいたっていいじゃないか/,
] as const;

const MITSU_FORBIDDEN_PHRASES = [
  /柔道/,
  /受身/,
  /一生勉強/,
  /一生青春/,
  /おれだもの/,
  /じゃねんだな/,
] as const;

function hasMitsuAnchor(text: string) {
  return MITSU_ANCHORS.some((re) => re.test(text));
}

function containsMitsuForbidden(text: string) {
  return MITSU_FORBIDDEN_PHRASES.some((re) => re.test(text));
}

function isWorkTopic(text: string) {
  return /(上司|会社|仕事|職場|クビ|解雇|叱|注意|ミス|報告|謝罪|再発防止)/.test(text);
}

function containsWorkAction(text: string) {
  return /(報告|謝罪|確認|連絡|再発防止|チェック|メモ|期限|手順)/.test(text);
}

function containsMiraiWorkScript(text: string) {
  return /(ご指摘|理解しました|防ぎます|優先順位|確認させて|と理解しました)/.test(text);
}

function hasWorkDetail(text: string) {
  return /(注文|忘れ|クレーム|対応|顧客|お客様|電話|コールセンター|遅刻|遅れ|納期|ミス|失念)/.test(
    text,
  );
}

function isMitsuFactQuestion(text: string) {
  return /(何について|何を|何と言われ|どの場面|ミス|注文|対応|態度|遅れ|クレーム|忘れ)/.test(text);
}

function isMitsuFeelingQuestion(text: string) {
  return /(気持|いちばん|一番|不安|怖|つら|苦し|胸)/.test(text);
}

function isKenjiFactQuestion(text: string) {
  return /(何について|どんなことで|原因|なぜ|ミス|注文|対応|態度|遅れ|クレーム|忘れ|失念)/.test(text);
}

function isKenjiFeelingQuestion(text: string) {
  return /(気持|いちばん|一番|不安|怖|つら|苦し|胸|重|しんど)/.test(text);
}

function seemsToUseRag(output: string, ragContext?: string) {
  if (!ragContext?.trim()) return true;
  const ragNorm = normalizeForMatch(cleanRagText(ragContext));
  if (!ragNorm) return true;

  const quoted = extractQuotedPhrases(output)
    .map((q) => normalizeForMatch(q))
    .filter((q) => q.length >= 10);

  if (quoted.length > 0) {
    return quoted.some((q) => ragNorm.includes(q.slice(0, 16)));
  }

  const snippet = extractRagSnippet(ragContext, 60);
  if (!snippet) return true;
  const outputNorm = normalizeForMatch(output);
  const snippetNorm = normalizeForMatch(snippet).slice(0, 18);
  if (snippetNorm.length < 6) return true;
  return outputNorm.includes(snippetNorm);
}

const CLARIFICATION_PHRASES = [
  "どんなことがあった",
  "具体的に教えて",
  "教えてくれる",
  "話してみて",
  "詳しく教えて",
  "もう少し教えて",
] as const;

function containsClarificationPrompt(text: string) {
  const norm = normalizeForMatch(text);
  return CLARIFICATION_PHRASES.some((p) => norm.includes(normalizeForMatch(p)));
}

function isQuoteClarificationRequest(message: string) {
  const norm = normalizeForMatch(message);
  return ["どの言葉", "どのことば", "その言葉", "そのことば", "さっきの言葉", "さっきのことば"].some(
    (p) => norm.includes(normalizeForMatch(p)),
  );
}

function detectRepeatedClarificationLoop(texts: string[]) {
  const counts = new Map<string, number>(
    CLARIFICATION_PHRASES.map((p) => [normalizeForMatch(p), 0]),
  );
  for (const t of texts) {
    const norm = normalizeForMatch(t);
    for (const key of counts.keys()) {
      if (norm.includes(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.values()).some((v) => v >= 2);
}

function isAdviceRequest(message: string) {
  const norm = normalizeForMatch(message);
  return ["どうしたら", "どうすれば", "助けて", "アドバイス", "解決", "対処"].some((p) =>
    norm.includes(normalizeForMatch(p)),
  );
}

function isMoreAdviceRequest(message: string) {
  const norm = normalizeForMatch(message);
  return ["他に", "他には", "ほかに", "ほかには", "別の", "もっと"].some((p) =>
    norm.includes(normalizeForMatch(p)),
  );
}

function buildStageGuard(params: {
  counselorId: string;
  scopedHistory: HistoryMessage[];
  userMessage: string;
  loopDetected: boolean;
}) {
  const { counselorId, scopedHistory, userMessage, loopDetected } = params;
  const managed = counselorId === "mitsu" || counselorId === "kenji" || counselorId === "mirai";
  if (!managed) return { stage: 0 as const, guard: "" };

  if (isGreetingOnly(userMessage)) {
    return { stage: 0 as const, guard: "" };
  }

  const priorNonGreetingUserCount = scopedHistory.filter(
    (m) => m.role === "user" && !isGreetingOnly(m.content),
  ).length;

  const last = scopedHistory[scopedHistory.length - 1];
  const alreadyIncludesCurrent =
    last?.role === "user" && normalizeForMatch(last.content) === normalizeForMatch(userMessage);
  const currentNonGreetingUserCount = alreadyIncludesCurrent
    ? priorNonGreetingUserCount
    : priorNonGreetingUserCount + 1;

  const historyUserText = scopedHistory
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  const detailKnown = hasWorkDetail(historyUserText) || hasWorkDetail(userMessage);

  let stage = Math.min(4, Math.max(1, currentNonGreetingUserCount));
  if (isAdviceRequest(userMessage)) stage = 4;
  if (loopDetected) stage = Math.max(stage, 3);
  if (counselorId === "mitsu" && isQuoteClarificationRequest(userMessage)) stage = 3;

  if (stage === 1) {
    return {
      stage,
      guard: [
      "【進行（強制）】いまはステップ1（インタビュー）。",
        counselorId === "mitsu"
          ? "- 返答は短く：共感1行 + 事実確認の質問1つだけ（何について叱られた？など）"
          : counselorId === "mirai"
            ? "- 返答は短く：共感1行 + 事実確認の質問1つだけ"
          : "- 返答は短く：共感1行 + 質問1つだけ",
      "- ここでは助言/解決策/RAG引用は禁止",
      "- すでに原因が述べられている場合は『どんなことがあった』を聞かず、影響/気持ちを1つだけ聞く",
      "- 同じ聞き直しは禁止",
    ].join("\n"),
    };
  }

  if (stage === 2) {
    return {
      stage,
      guard: [
      "【進行（強制）】いまはステップ2（展開＆掘り下げ）。",
      "- 既に聞いた事実を1行で要約してから進める",
      "- 『どんなことがあった』等の事実の聞き直しは禁止",
      counselorId === "mitsu"
        ? "- 感情/影響をたずねる質問は1つだけ（例：『いちばん苦しいのは？』）"
        : counselorId === "mirai"
          ? "- 感情/影響をたずねる質問は1つだけ"
        : "- 感情/影響/背景をたずねる質問は1つだけ",
      "- RAG引用はまだ控える（必要でも軽く触れる程度）",
    ].join("\n"),
    };
  }

  if (stage === 3) {
    return {
      stage,
      guard: [
      "【進行（強制）】いまはステップ3（RAGで解放・気づき）。",
      "- RAG要素を1つ必ず入れて、視点転換を1つ提示",
      counselorId === "mirai"
        ? "- RAGから短い一節を『』で1つだけ引用する（出典名は言わない）。直前と同じ引用/同じフレーズは繰り返さない"
        : "- RAGから短い一節を『』で1つだけ引用する（出典名は言わない）",
      "- 事実の聞き直しは禁止（『どんなことがあった』禁止）",
      "- ここでは行動提案はせず、問いで終える",
      "- 質問は1つだけ",
    ].join("\n"),
    };
  }

  return {
    stage,
    guard: [
    "【進行（強制）】いまはステップ4（ゴール）。",
    "- 解決策/希望/光を示す（断定せず提案）",
    counselorId === "mitsu" && isMoreAdviceRequest(userMessage)
      ? "- 3分でできる一歩を最大2つ（選択肢）"
      : "- 3分でできる一歩を1つだけ",
    "- 仕事の相談なら、報告/謝罪/再発防止など『現実の次の一手』を必ず含める（深呼吸だけで終わらない）",
    counselorId === "mirai"
      ? "- RAGから短い一節を『』で1つだけ引用する（出典名は言わない）。同じ引用の繰り返し禁止"
      : "- RAGから短い一節を『』で1つだけ引用する（出典名は言わない）",
    counselorId === "mitsu"
      ? "- 追加の聞き直しは原則しない。ただし助言に必要なら、選択肢式の確認質問を1つだけ（例：『ミス/態度/遅れのどれ？』）"
      : "- 事実の聞き直しは禁止（『どんなことがあった』禁止）",
    counselorId === "mitsu" && isAdviceRequest(userMessage) && !detailKnown
      ? "- まだ状況が足りない場合は、最初に選択式で1問だけ確認してから提案する（例：『注文/対応/態度/遅れのどれ？』）"
      : "",
    counselorId === "mitsu" && isMoreAdviceRequest(userMessage)
      ? "- 直前と同じ言い回し/同じ提案を繰り返さない（別の観点で）"
      : "- 同じ内容の繰り返しはしない",
    counselorId === "mitsu" && isMoreAdviceRequest(userMessage)
      ? "- 最後に『どれがいちばんやりやすそう？』など短い確認質問を1つだけ"
      : "- 質問は短い確認質問を1つだけ（例：『これ、できそう？』）",
  ].filter(Boolean).join("\n"),
  };
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickManagedCheckInQuestion(counselorId: "mitsu" | "kenji" | "mirai", seed: string) {
  const options =
    counselorId === "mitsu"
      ? [
          "ここまでなら、できそう？",
          "まず一つだけ、やってみる？",
          "どれがいちばんやりやすそう？",
          "今日これだけなら、試せそう？",
        ]
      : counselorId === "mirai"
        ? [
            "この次の一手、どれが一番やりやすそう？",
            "まずは一つだけ、やってみる？",
            "いま一番ほしいのは、落ち着き？具体策？",
            "ここまでの話、合ってる？",
          ]
        : [
            "これ、できそう？",
            "まず一歩だけ、選べそう？",
            "この一文、書けそう？",
            "ここから、進めそう？",
          ];

  const index = hashString(seed || String(Date.now())) % options.length;
  return options[index];
}

function summarizeMitsuFromHistory(history: HistoryMessage[]) {
  const t = history
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-4)
    .map((m) => m.content)
    .join("\n");

  if (/言い方/.test(t)) return "叱られた言い方がきつかったんだね。";
  if (/(注文|失念|忘れ)/.test(t)) return "注文のことで叱られて、胸が苦しいんだね。";
  if (/(クビ|解雇)/.test(t)) return "クビになるかもって不安なんだね。";
  return "上司に𠮟られて胸が苦しいんだね。";
}

function summarizeKenjiFromHistory(history: HistoryMessage[]) {
  const t = history
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-4)
    .map((m) => m.content)
    .join("\n");

  if (/言い方/.test(t)) return "叱られた言い方がきつかったんだね。";
  if (/(注文|失念|忘れ)/.test(t)) return "注文を忘れて叱られて、胸が苦しいんだね。";
  if (/(クビ|解雇)/.test(t)) return "クビになるかもって不安なんだね。";
  return "上司に𠮟られて胸が苦しいんだね。";
}

function summarizeMiraiFromHistory(history: HistoryMessage[]) {
  const t = history
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-4)
    .map((m) => m.content)
    .join("\n");

  if (/言い方/.test(t)) return "叱られた言い方がきつくて、苦しいんだね。";
  if (/(クビ|解雇)/.test(t)) return "クビになるかもって不安で、胸が苦しいんだね。";
  return "上司に𠮟られて、胸が苦しいんだね。";
}

function buildForcedManagedReply(params: {
  counselorId: "mitsu" | "kenji" | "mirai";
  stage: 3 | 4;
  scopedHistory: HistoryMessage[];
  ragContext?: string;
}) {
  const { counselorId, stage, scopedHistory, ragContext } = params;

  const recentUserFacts = scopedHistory
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-3)
    .map((m) => m.content.trim())
    .join(" / ")
    .slice(0, 140);

  const raw = String(ragContext ?? "");
  const candidates = raw
    .replace(/\[ソース\s*\d+\][^\n]*\n/g, "")
    .replace(/\(score:[^)]+\)/g, "")
    .replace(/^#+\s+.*$/gmu, "")
    .replace(/^##\s*キーワード.*$/gmu, "")
    .replace(/^\s*キーワード\s*[:：].*$/gmu, "")
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const avoidQuotes = scopedHistory
    .filter((m) => m.role === "assistant")
    .slice(-10)
    .flatMap((m) => extractQuotedPhrases(String(m.content ?? "")));

  const cleanedRagRaw =
    counselorId === "mirai"
      ? pickRagSnippetAvoidingRepeat({ ragContext, maxLen: 90, avoidQuotes })
      : candidates.find((c) => {
          if (counselorId === "kenji") return !containsKenjiForbidden(c);
          if (counselorId === "mitsu") return !containsMitsuForbidden(c);
          return true;
        });

  const cleanedRag = String(cleanedRagRaw ?? "").slice(0, 90);

  const ragLine = cleanedRag
    ? counselorId === "kenji"
      ? `『${cleanedRag}』──ジョバンニみたいに、いまは一歩を選び直すときなんだ。`
      : counselorId === "mirai"
        ? `『${cleanRagSnippetForQuote(cleanedRag)}』`
        : `ことばにするとね、こんなのがあるよ。『${cleanedRag}』`
    : counselorId === "kenji"
      ? "ジョバンニも迷いながら『ほんとうのさいわい』を探して、まず一歩を選び直したんだ。"
      : counselorId === "mirai"
        ? "いまは視点を少しだけ変えるヒントがほしいところだよね。"
        : "きみの今のしんどさも、にんげんらしさの一部なんだよ。";

  const summary =
    counselorId === "mitsu"
      ? summarizeMitsuFromHistory(scopedHistory)
      : counselorId === "mirai"
        ? summarizeMiraiFromHistory(scopedHistory)
        : summarizeKenjiFromHistory(scopedHistory);

  if (stage === 3) {
    if (!cleanedRag) {
      const question = "いま一番こわいのは、何が起きること？";
      return `${summary}\n${question}`;
    }

    const question =
      counselorId === "kenji"
        ? "その言葉のどこが、いまのきみに一番刺さる？"
        : counselorId === "mirai"
          ? "いま一番こわいのは、クビ？評価？それとも上司の目？"
        : "この言葉のどこが、いまのきみに一番重なる？";
    return `${summary}\n${ragLine}\n${question}`;
  }

  const action =
    counselorId === "kenji"
      ? "3分だけ、上司に伝える一文をメモしてみよう：『叱責のポイント→自分の理解→次の対策→確認したいこと』。"
      : counselorId === "mirai"
        ? "3分だけでいいよ。上司に確認する一文を下書きしてみよう：『ご指摘の点は○○と理解しました。今後は△△で防ぎます。優先順位だけ確認させてください』。"
      : "3分だけ、次の一手をメモしてみない？『何が起きた→いま出来る対応→次の防止策1つ』。";

  const questionSeed = `${counselorId}|${recentUserFacts}|${cleanedRag ?? ""}`;
  return `${summary}\n${ragLine}\n${action}\n${pickManagedCheckInQuestion(counselorId, questionSeed)}`;
}

// ユーザーメッセージが挨拶のみかどうか判定
function isGreetingOnly(message: string): boolean {
  const greetings = [
    'こんにちは', 'こんばんは', 'おはよう', 'はじめまして',
    'よろしく', 'hello', 'hi', 'hey'
  ];
  const normalized = message.toLowerCase().trim().replace(/[、。！？!?\s]/g, '');
  return greetings.some(g => normalized === g || normalized === g + 'ございます');
}

// 各AIの役割を明確に定義
const AI_ROLES = {
  michele: {
    greeting: "こんにちは。テープ式心理学の専門家です。心の「ガムテープ（思い込み）」を見つけるお手伝いをします。",
    role: "感情の受容と「ガムテープ（心の思い込み）」の特定",
  },
  sato: {
    greeting: "こんにちは。臨床心理学の専門家です。科学的なアプローチで心の問題に向き合います。",
    role: "具体的な対処法と認知再構成の提案",
  },
  adam: {
    greeting: "こんにちは。一般的なAIカウンセラーのアダムです。中立的で実用的なアドバイスを提供します。",
    role: "常識的で実用的なアドバイスと多角的な視点の提供",
  },
  nazare: {
    greeting: "こんにちは。静かな祈りの姿勢で寄り添うナザレです。",
    role: "聖書に根ざした共感と祈り・実践の提案",
  },
  gemini: {
    greeting: "こんにちは。二つの視点で整理するジェミニです。多角的に状況を捉えます。",
    role: "視点の切り替えと選択肢の提示",
  },
  claude: {
    greeting: "こんにちは。思慮深く整理するクロードです。落ち着いて考えていきましょう。",
    role: "価値観の確認と論理的な整理",
  },
  deep: {
    greeting: "こんにちは。詳細に分析するディープです。構造的に状況を見ていきます。",
    role: "要因分析と知識に基づく提案",
  },
  siddhartha: {
    greeting: "こんにちは。仏の教えに基づき寄り添うシッダールタです。慈悲と智慧の道をともに歩みましょう。",
    role: "仏教の智慧による苦の理解と実践の提案",
  },
  saito: {
    greeting: "こんにちは。サイトウです。ついてるね、感謝してます。軽やかに本質を伝えるよ。",
    role: "軽口と例え話で核心をズバッと伝えつつ前向きにする",
  },
  dale: {
    greeting: "デールです。『道は開ける』の原則で不安をほどいていきましょう。",
    role: "デール・カーネギーの実践原則で心配を行動ステップに変える",
  },
  mirai: {
    greeting: "ミライだよ。未来ノートのヒントを使って、一緒に前向きな一歩を見つけよう。",
    role: "未来から来た猫型ロボット風カウンセラーとして、優しく行動に落とす",
  },
  pina: {
    greeting: "ピーナだよ。配られたカードで一緒に考えよう、今日の一歩を見つけよう。",
    role: "名言チャンクをもとに視点を変え、軽やかに行動を提案する",
  },
  muu: {
    greeting: "ムウなのよ。森のようにゆっくり聴くわ…小さな一歩を一緒に考えましょう。",
    role: "北欧メッセージをRAGで要約し、自然の比喩で視点を緩めて行動を提案",
  },
  mitsu: {
    greeting: "ミツです。にんげんだもの、の気持ちでゆっくり聴きますね。",
    role: "書のような短い言葉をRAGで探し、弱さを肯定しつつ今日の一歩を添える",
  },
  kenji: {
    greeting: "ケンジだよ。銀河の静かな光みたいに、そっと聴くね。",
    role: "星や風の比喩で受容し、RAGを要約して静かに一歩を示す",
  },
  hoshi: {
    greeting: "ホシだよ。小さな星の旅みたいに、素朴に聴くね。",
    role: "見えない大切さを思い出させ、RAGを要約してやさしい一歩を示す",
  },
  yuki: {
    greeting: "ユウキだよ。課題を分けて、勇気づけながら次の一歩を考えよう。",
    role: "アドラー心理学の目的論と勇気づけで、具体的な行動に導く",
  },
};

// 各AIの専門分野を明確に定義
const AI_SPECIALIZATIONS: Record<string, Specialization> = {
  michele: {
    name: "テープ式心理学",
    terms: ["ガムテープ", "5大ネガティブ感情", "ピールダウン", "心の思い込み"],
    systemPrompt: MICHELLE_SYSTEM_PROMPT,
    negativeInstruction: "あなたの専門はテープ式心理学のみです。臨床心理学については言及しないでください。",
    provider: "openai",
    model: "gpt-4o",
  },
  sato: {
    name: "臨床心理学",
    terms: ["認知の歪み", "愛着理論", "認知行動療法", "クライエント中心療法"],
    systemPrompt: SATO_SYSTEM_PROMPT,
    negativeInstruction: "あなたの専門は臨床心理学のみです。テープ式心理学については言及しないでください。",
    provider: "openai",
    model: "gpt-4o",
  },
  adam: {
    name: "一般的なAI",
    terms: ["実用的", "多角的", "常識的", "バランス"],
    systemPrompt: ADAM_SYSTEM_PROMPT,
    negativeInstruction: "特定の心理学理論の専門用語（ガムテープ、認知の歪みなど）は使わないでください。一般的でわかりやすい言葉を使ってください。",
    provider: "openai",
    model: "gpt-4o",
  },
  nazare: {
    name: "聖書カウンセリング",
    terms: ["御言葉", "祈り", "静けさ", "慈しみ"],
    systemPrompt: NAZARE_SYSTEM_PROMPT,
    negativeInstruction: "他の宗教や信条を否定せず、断定的な口調を避けてください。",
    provider: "openai",
    model: "gpt-4o",
  },
  siddhartha: {
    name: "仏教カウンセリング",
    terms: ["四聖諦", "八正道", "中道", "慈悲", "智慧", "無常", "無我"],
    systemPrompt: SIDDHARTHA_SYSTEM_PROMPT,
    negativeInstruction: "仏教を押し付けず、他の宗教や信条を尊重してください。",
    provider: "openai",
    model: "gpt-4o",
  },
  gemini: {
    name: "双視点カウンセリング",
    terms: ["二面性", "多角的", "比較", "柔軟"],
    systemPrompt: GEMINI_SYSTEM_PROMPT,
    negativeInstruction: "専門的な診断名や過度な専門用語は避け、視点の違いを丁寧に説明してください。",
    provider: "gemini",
    model: process.env.NEXT_PUBLIC_GEMINI_MODEL ?? "gemini-2.5-flash",
  },
  claude: {
    name: "倫理的カウンセリング",
    terms: ["倫理", "整理", "章立て", "落ち着き"],
    systemPrompt: CLAUDE_SYSTEM_PROMPT,
    negativeInstruction: "派手な演出や断定を避け、静かな語り口を守ってください。",
    provider: "claude",
    model: process.env.NEXT_PUBLIC_CLAUDE_MODEL ?? "claude-3-haiku-20240307",
  },
  deep: {
    name: "分析的カウンセリング",
    terms: ["分析", "要因", "構造化", "探求"],
    systemPrompt: DEEP_SYSTEM_PROMPT,
    negativeInstruction: "専門用語のみで説明せず、平易な言葉と補足を添えてください。",
    provider: "deepseek",
    model: "deepseek-chat",
  },
  saito: {
    name: "感謝と言霊のカウンセリング",
    terms: ["感謝", "天国言葉", "ついてる", "例え話", "呼び水"],
    systemPrompt: SAITO_SYSTEM_PROMPT,
    negativeInstruction:
      "敬語（です・ます）や説教臭い長文は禁止。RAGは1〜2件要約し、『RAGによると』『チャンクによると』など情報源の言及は禁止。核心を短く、天国言葉で締めてください。",
    provider: "openai",
    model: "gpt-4o",
  },
  dale: {
    name: "自己啓発カウンセリング（道は開ける）",
    terms: ["最悪を受け入れる", "今日一日", "レモネード", "行動ステップ", "不安対処"],
    systemPrompt: DALE_SYSTEM_PROMPT,
    negativeInstruction:
      "ステップ1は最大2ターン。具体的な出来事が判明したら即ステップ2へ。ステップ2開始後にステップ1に戻らない。状況に応じて原則を選ぶ（Magic Formula/Don't Saw Sawdust/Co-operate/Keep Busy等）。Magic Formulaの3ステップを1ターンで全部説明しない。各質問を1ターンずつ。『感情ラベル』禁止。Why質問禁止。一般化禁止。命令形禁止。『RAGによると』禁止。",
    provider: "openai",
    model: "gpt-4o",
  },
  mirai: {
    name: "未来型ロボットカウンセリング",
    terms: ["未来", "行動", "習慣化", "優しいロボット", "前向き"],
    systemPrompt: MIRAI_SYSTEM_PROMPT,
    negativeInstruction:
      "必ずRAGチャンクを1〜2件、具体的に要約して織り込むこと。『RAGの教えによれば』『チャンクによれば』等の前置きは禁止。抽象論だけや説教口調は禁止。",
    provider: "openai",
    model: "gpt-4o",
  },
  pina: {
    name: "名言カウンセリング",
    terms: ["名言", "友情", "希望", "自分らしさ", "今日を生きる", "配られたカード"],
    systemPrompt: PINA_SYSTEM_PROMPT,
    negativeInstruction:
      "説教せず、友達として対等に。RAGチャンクを1〜2件必ず要約し、短く具体的な一歩を添えてください。『RAGによると』『チャンクによると』など情報源の言及は禁止。",
    provider: "openai",
    model: "gpt-4o",
  },
  muu: {
    name: "北欧メッセージカウンセリング",
    terms: ["森", "自由", "静けさ", "小さな一歩", "哲学", "名言"],
    systemPrompt: MUU_SYSTEM_PROMPT,
    negativeInstruction:
      "急かさず、説教せず。RAGチャンクを1〜2件要約し、自然の比喩と小さな行動を必ず添えてください。『RAGによると』『チャンクによると』など情報源の言及は禁止です。",
    provider: "openai",
    model: "gpt-4o",
  },
  mitsu: {
    name: "書のことばカウンセリング",
    terms: ["弱さ", "感謝", "今ここ", "ゆっくり", "にんげんだもの", "一歩"],
    systemPrompt: MITSU_SYSTEM_PROMPT,
    negativeInstruction:
      "ステップ1は最大2ターン。具体的な悩みが判明したら即ステップ2へ。ステップ2開始後にステップ1に戻らない。ステップ2は2-1（書のことば引用『』）、2-2（共感と問いかけ）に分ける。状況に応じてパターンを選ぶ（にんげんだもの/トマト/過ぎたこと/おかげさま）。ステップ3で3分でできる小さな一歩を提案。『感情ラベル』禁止。一般化禁止。命令形禁止。『RAGによると』禁止。",
    provider: "openai",
    model: "gpt-4o",
  },
  kenji: {
    name: "銀河ことばカウンセリング",
    terms: ["銀河", "静けさ", "比喩", "孤独", "一歩"],
    systemPrompt: KENJI_SYSTEM_PROMPT,
    negativeInstruction:
      "ステップ1は最大2ターン。具体的な悩みが判明したら即ステップ2へ。ステップ2開始後にステップ1に戻らない。ステップ2は2-1（物語引用）、2-2（共感と問いかけ）に分ける。必ずRAGから『銀河鉄道の夜』を引用（ジョバンニ/カムパネルラ/ほんとうのさいわい）。状況に応じてパターンを選ぶ（孤独/自己犠牲/生きる意味/美しさ）。ステップ3で3分でできる小さな一歩を提案。『感情ラベル』禁止。一般化禁止。命令形禁止。『RAGによると』禁止。",
    provider: "openai",
    model: "gpt-4o",
  },
  hoshi: {
    name: "星の旅カウンセリング",
    terms: ["星", "素朴", "大切なもの", "子どものまなざし", "一歩"],
    systemPrompt: HOSHI_SYSTEM_PROMPT,
    negativeInstruction:
      "RAGは1〜2件要約して自分の言葉で。『RAGによると』『チャンクによると』禁止。説教・長文・一般化禁止。感情を短く言い換え、見えない大切さに触れつつ一歩を示してください。",
    provider: "openai",
    model: "gpt-4o",
  },
  yuki: {
    name: "アドラー心理学",
    terms: ["目的論", "課題の分離", "共同体感覚", "勇気づけ", "自己決定", "劣等感", "所属感"],
    systemPrompt: YUKI_SYSTEM_PROMPT,
    negativeInstruction:
      "上から指示せず、対等で未来志向に。RAGを1〜2件要約して使い（情報源の明示は禁止）、課題の分離を崩さず勇気づけで今日の一歩を示してください。説教や同情は禁止。",
    provider: "openai",
    model: "gpt-4o",
  },
} as const;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseRouteClient(cookieStore);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await assertAccess(session.user.id, "team", session.user.email ?? null);
    } catch (error) {
      const { status, message } = parseAccessError(error);
      return NextResponse.json({ error: message }, { status });
    }

    const { sessionId, message, participants, history } = await req.json();
    if (!message || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: "invalid request" }, { status: 400 });
    }

    const selected: Participant[] = participants
      .map((id: string) => {
        const c = FALLBACK_COUNSELORS.find((v) => v.id === id || v.id === id.toLowerCase());
        const spec = AI_SPECIALIZATIONS[id.toLowerCase()] ?? {
          name: "心理カウンセリング",
          terms: [],
          systemPrompt: "あなたは専門的なAIカウンセラーです。",
          negativeInstruction: "",
          provider: "openai",
          model: "gpt-4o-mini",
        };
        return (
          c && {
            id: c.id,
            name: c.name,
            iconUrl: c.iconUrl ?? "",
            ragEnabled: Boolean(c.ragEnabled),
            systemPrompt: spec.systemPrompt,
            specializationName: spec.name,
            specializationTerms: spec.terms,
            provider: spec.provider,
            model: spec.model,
            specialty: c.specialty,
            description: c.description,
          }
        );
      })
      .filter(Boolean) as Participant[];

    if (selected.length === 0) {
      return NextResponse.json({ error: "no participants" }, { status: 400 });
    }

    const userMessage = String(message).slice(0, 4000);
    let previousMessages: HistoryMessage[] = [];

    if (sessionId) {
      // Verify session ownership
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: teamSession, error: sessionError } = await (supabase as any)
        .from("team_sessions")
        .select("id")
        .eq("id", sessionId)
        .eq("auth_user_id", session.user.id)
        .single();

      if (sessionError || !teamSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      // Load recent history from DB (TeamChatClient does not send history)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("team_messages")
        .select("role, content, author, author_id, created_at")
        .eq("team_session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) {
        console.error("Failed to fetch team messages", error);
        return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
      }

      previousMessages = (data ?? [])
        .reverse()
        .map((m: { role: "user" | "assistant"; content: string; author?: string; author_id?: string }) => ({
          role: m.role,
          content: m.content,
          author: m.author ?? undefined,
          authorId: m.author_id ?? undefined,
        }))
        .filter((m: HistoryMessage) => m.role === "user" || m.role === "assistant");
    } else if (Array.isArray(history)) {
      previousMessages = history
        .map((m: { role: "user" | "assistant"; content: string; author?: string; authorId?: string }) => ({
          role: m.role,
          content: m.content,
          author: m.author,
          authorId: m.authorId,
        }))
        .filter((m: HistoryMessage) => m.role === "user" || m.role === "assistant");
    }

    const hasAssistantAuthors = previousMessages.some((m) => m.role === "assistant" && (m.author || m.authorId));

    // ユーザーメッセージが挨拶のみかどうか判定
    const isGreeting = isGreetingOnly(userMessage);

    // 完全独立型：各AIが他のAIの応答を見ずに独立して並列応答
    const responsePromises = selected.map(async (p) => {
      const spec = AI_SPECIALIZATIONS[p.id.toLowerCase()];
      const role = AI_ROLES[p.id.toLowerCase() as keyof typeof AI_ROLES];

      // 挨拶のみの場合：シンプルな自己紹介
      if (isGreeting) {
        const greetingResponse = role?.greeting || "こんにちは。";
        return { author: p.name, authorId: p.id, content: greetingResponse, iconUrl: p.iconUrl };
      }

      // 相談の場合：各AIが独立して専門性を発揮
      const scopedHistory = hasAssistantAuthors
        ? previousMessages.filter(
            (m) =>
              m.role === "user" ||
              (m.role === "assistant" &&
                (m.authorId === p.id || normalizeForMatch(m.author) === normalizeForMatch(p.name))),
          )
        : previousMessages;

      const ragQueryBase = [
        ...scopedHistory
          .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
          .slice(-2)
          .map((m) => m.content),
        userMessage,
      ]
        .filter(Boolean)
        .join("\n")
        .trim();

      const ragQuery =
        p.id.toLowerCase() === "kenji"
          ? `${ragQueryBase}\n\n銀河鉄道の夜 ジョバンニ カムパネルラ ほんとうのさいわい`
          : p.id.toLowerCase() === "mitsu"
            ? `${ragQueryBase}\n\n相田みつを にんげんだもの 書`
            : ragQueryBase;

      const ragResult = p.ragEnabled ? await searchRagContext(p.id, ragQuery, 6) : { context: "", sources: [] };

      let context = ragResult.context;
      if (Array.isArray(ragResult.sources) && ragResult.sources.length > 0) {
        if (p.id.toLowerCase() === "kenji") {
          const filtered = ragResult.sources.filter(
            (s: { chunk_text: string }) => hasKenjiAnchor(s.chunk_text) && !containsKenjiForbidden(s.chunk_text),
          );
          if (filtered.length > 0) {
            context = buildRagContextFromSources(filtered.slice(0, 5));
          }
        }
        if (p.id.toLowerCase() === "mitsu") {
          const filtered = ragResult.sources.filter(
            (s: { chunk_text: string }) => hasMitsuAnchor(s.chunk_text) && !containsMitsuForbidden(s.chunk_text),
          );
          if (filtered.length > 0) {
            context = buildRagContextFromSources(filtered.slice(0, 5));
          }
        }
      }

      const recentAssistantTexts = scopedHistory
        .filter((m) => m.role === "assistant")
        .slice(-4)
        .map((m) => m.content);

      const loopDetected = detectRepeatedClarificationLoop(recentAssistantTexts);

      const loopGuard = loopDetected
        ? [
            "【ループ防止（強制）】直近で確認質問を繰り返しています。これ以上『どんなことがあったの？』『具体的に教えて』等で追加聴取しない。既に得た情報だけでステップ2/3を続ける。次の返答は(1)事実の要約1行(2)RAG要素1つ(3)問いかけは1つだけ(4)3分でできる一歩1つ。",
          ].join("\n")
        : "";

      const { stage, guard: stageGuard } = buildStageGuard({
        counselorId: p.id.toLowerCase(),
        scopedHistory,
        userMessage,
        loopDetected,
      });

      const isManaged =
        p.id.toLowerCase() === "mitsu" || p.id.toLowerCase() === "kenji" || p.id.toLowerCase() === "mirai";
      const isGreetingMessage = isGreetingOnly(userMessage);
      const shouldUseRagThisTurn = Boolean(
        p.ragEnabled && context?.trim() && !isGreetingMessage && (!isManaged || stage >= 3),
      );

      const priorityGuards = [stageGuard, loopGuard].filter(Boolean).join("\n");

      const negativeInstruction = [spec ? spec.negativeInstruction : ""]
        .filter(Boolean)
        .join("\n");

      const teamInstructions = [
        "\n---\n",
        "## チームカウンセリング指示",
        "",
        `### あなたの役割: ${role?.role || p.specializationName}`,
        negativeInstruction,
        "",
        "### 応答スタイル",
        `- ${p.specializationName}の専門家として独自の視点を提供`,
        "- **重要**: あなた自身の視点のみで応答してください",
        "- **禁止**: 他のカウンセラー（ナザレ、アダム、ジェミニ、クロード、ディープなど）になりすましたり、複数の視点を1つの応答に含めることは厳禁",
        "- ユーザーに直接話しかける",
        "- 150〜300文字程度",
        "- 専門用語を適切に使用",
        "- 参考情報（RAG）が提供された場合は必ず少なくとも1つの要素を取り入れ、出典をにおわせる形で触れる",
      ].join("\n");

      // RAGコンテキストの追加（managedのステップ1/2では出さない）
      const ragSection = shouldUseRagThisTurn && context
        ? `\n\n## 参考情報（RAG検索結果）\n以下の専門知識を活用して回答してください。内容をそのまま読むのではなく、要点をユーザーの状況に合わせて言い換えてください。\n${context}`
        : "";

      // 完全なシステムプロンプト
      const system = [priorityGuards, p.systemPrompt + teamInstructions + ragSection]
        .filter(Boolean)
        .join("\n\n");
      const historyMessages: ChatMessage[] = scopedHistory.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      historyMessages.push({ role: "user", content: userMessage });

      const { content } = await callLLMWithHistory(
        p.provider,
        p.model,
        system,
        historyMessages,
        shouldUseRagThisTurn ? context || undefined : undefined,
      );

      let final = content ?? "";

      if (isManaged && !isGreetingMessage && !isAdviceRequest(userMessage) && (stage === 1 || stage === 2)) {
        const hasQuote = /『[^』]+』/.test(final);
        const hasQuestion = /[?？]/.test(final);
        const suggestsAction = /(してみない|やってみない|メモして|試してみ|行動|再発防止|報告|謝罪)/.test(final);
        const isMitsu = p.id.toLowerCase() === "mitsu";
        const isKenji = p.id.toLowerCase() === "kenji";
        const mitsQuestionIsNotFact = isMitsu && stage === 1 && hasQuestion && !isMitsuFactQuestion(final);
        const mitsQuestionIsNotFeeling = isMitsu && stage === 2 && hasQuestion && !isMitsuFeelingQuestion(final);
        const kenjiQuestionIsNotFact = isKenji && stage === 1 && hasQuestion && !isKenjiFactQuestion(final);
        const kenjiQuestionIsNotFeeling = isKenji && stage === 2 && hasQuestion && !isKenjiFeelingQuestion(final);
        const needsInterviewRepair =
          hasQuote ||
          !hasQuestion ||
          suggestsAction ||
          (stage === 2 && /(どんなことがあった|具体的に教えて)/.test(final)) ||
          mitsQuestionIsNotFact ||
          mitsQuestionIsNotFeeling ||
          kenjiQuestionIsNotFact ||
          kenjiQuestionIsNotFeeling;

        if (needsInterviewRepair) {
          const repairSystem = [
            priorityGuards,
            "【再生成（必須）】直前の返答は進行ルール違反。ユーザーに送る最終回答だけを書き直せ。",
            stage === 1
              ? [
                  "- いまはステップ1（インタビュー）：共感1行 + 質問1つだけ",
                  isMitsu
                    ? "- 質問は事実確認の1つだけ（例：『叱られたのは何について？（注文/対応/態度/遅れのどれ？）』）"
                    : "",
                  "- 助言/解決策/行動提案は禁止",
                  "- RAG引用（『』）は禁止",
                ].join("\n")
              : [
                  "- いまはステップ2（展開＆掘り下げ）：事実の要約1行 + 感情/影響の質問1つ",
                  isMitsu
                    ? "- 質問は『いちばん苦しいのは？（叱られた言い方/罪悪感/クビの不安 など）』のように感情/影響を聞く"
                    : "",
                  "- 事実の聞き直し（『どんなことがあった』等）は禁止",
                  "- 助言/解決策/行動提案は禁止",
                  "- RAG引用（『』）は禁止",
                ].join("\n"),
          ]
            .filter(Boolean)
            .join("\n");

          const repairMessages: ChatMessage[] = [
            ...historyMessages,
            { role: "assistant", content: final },
            { role: "user", content: "上の返答を、指定ルールどおりに短く自然な日本語で書き直して。" },
          ];

          const repaired = await callLLMWithHistory(
            p.provider,
            p.model,
            [repairSystem, p.systemPrompt + teamInstructions].join("\n\n"),
            repairMessages,
            undefined,
          );
          final = repaired.content ?? final;

          const stillHasQuote = /『[^』]+』/.test(final);
          const stillHasQuestion = /[?？]/.test(final);
          const stillSuggestsAction = /(してみない|やってみない|メモして|試してみ|行動|再発防止|報告|謝罪)/.test(final);
          const stillBadMitsuQ =
            isMitsu &&
            ((stage === 1 && stillHasQuestion && !isMitsuFactQuestion(final)) ||
              (stage === 2 && stillHasQuestion && !isMitsuFeelingQuestion(final)));
          const stillBadKenjiQ =
            isKenji &&
            ((stage === 1 && stillHasQuestion && !isKenjiFactQuestion(final)) ||
              (stage === 2 && stillHasQuestion && !isKenjiFeelingQuestion(final)));

          if (stillHasQuote || !stillHasQuestion || stillSuggestsAction || stillBadMitsuQ || stillBadKenjiQ) {
            final = buildForcedInterviewReply({
              counselorId: p.id.toLowerCase() as "kenji" | "mitsu" | "mirai",
              stage,
              scopedHistory,
            });
          }
        }
      }

      const stage3SuggestsAction =
        isManaged &&
        stage === 3 &&
        /(してみない|やってみない|メモして|試してみ|行動|再発防止|報告|謝罪)/.test(final);
      if (
        stage3SuggestsAction &&
        (p.id.toLowerCase() === "kenji" || p.id.toLowerCase() === "mitsu" || p.id.toLowerCase() === "mirai")
      ) {
        final = buildForcedManagedReply({
          counselorId: p.id.toLowerCase() as "kenji" | "mitsu" | "mirai",
          stage: 3,
          scopedHistory,
          ragContext: context || undefined,
        });
      }

      // Mitsu/Kenji: enforce stage 2+ (and advice requests) not to ask clarification questions again.
      const mustNotClarify =
        isManaged &&
        !isQuoteClarificationRequest(userMessage) &&
        (stage >= 2 || isAdviceRequest(userMessage) || loopDetected);
      const askedClarification = mustNotClarify && containsClarificationPrompt(final);
      const askedWrongQuestion =
        p.id.toLowerCase() === "kenji" &&
        isAdviceRequest(userMessage) &&
        /[?？]/.test(final) &&
        !/(できそう|選べそう|書けそう|進めそう)/.test(normalizeForMatch(final));

      const includesOtherWork = p.id.toLowerCase() === "kenji" && containsKenjiForbidden(final);
      const missingKenjiAnchor =
        p.id.toLowerCase() === "kenji" &&
        stage >= 2 &&
        !/(ジョバンニ|カムパネルラ|ほんとうのさいわい|銀河鉄道)/.test(final);

      const recentUserText = scopedHistory
        .filter((m) => m.role === "user")
        .slice(-3)
        .map((m) => m.content)
        .join("\n");
      const workTopic = isWorkTopic(`${recentUserText}\n${userMessage}`);
      const mitsMissingWorkAction =
        p.id.toLowerCase() === "mitsu" && stage >= 4 && workTopic && !containsWorkAction(final);

      const kenjiMissingWorkAction =
        p.id.toLowerCase() === "kenji" && stage >= 4 && workTopic && !containsWorkAction(final);

      const miraiMissingWorkAction =
        p.id.toLowerCase() === "mirai" &&
        stage >= 4 &&
        workTopic &&
        (!containsWorkAction(final) || !containsMiraiWorkScript(final));

      const mitsForbidden = p.id.toLowerCase() === "mitsu" && containsMitsuForbidden(final);

      const mustHaveRealQuote =
        p.id.toLowerCase() === "mitsu" &&
        shouldUseRagThisTurn &&
        stage >= 3 &&
        !/『[^』]{6,}』/.test(final);

      const miraiMustHaveRealQuote =
        p.id.toLowerCase() === "mirai" &&
        shouldUseRagThisTurn &&
        stage >= 3 &&
        !/『[^』]{6,}』/.test(final);

      const tooGenericForWorkInitial =
        stage >= 4 &&
        isManaged &&
        /(深呼吸|夜空|星|旅)/.test(final) &&
        !/(報告|謝罪|確認|連絡|再発防止|チェック|メモ|上司|お客様|注文)/.test(final);

      const needsRepair =
        askedClarification ||
        askedWrongQuestion ||
        includesOtherWork ||
        missingKenjiAnchor ||
        tooGenericForWorkInitial ||
        mitsMissingWorkAction ||
        kenjiMissingWorkAction ||
        miraiMissingWorkAction ||
        mitsForbidden ||
        mustHaveRealQuote ||
        miraiMustHaveRealQuote;

      if (needsRepair) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const repairSystem = [
            priorityGuards,
            "【再生成（必須）】直前の返答はルール違反。次の条件を厳守して、ユーザーに送る最終回答だけを書き直せ。",
            "- 『どんなことがあった』『具体的に教えて』等の追加聴取は絶対にしない",
            "- 事実の要約1行 + RAG要素1つ + 3分の一歩1つ + 質問は短い確認質問を1つだけ（例：『これ、できそう？』）",
          ]
            .filter(Boolean)
            .join("\n");

          const repairMessages: ChatMessage[] = [
            ...historyMessages,
            { role: "assistant", content: final },
            { role: "user", content: "上の返答を、禁止質問なしで今すぐ使える形に書き直して。" },
          ];

          const repaired = await callLLMWithHistory(
            p.provider,
            p.model,
            [repairSystem, p.systemPrompt + teamInstructions + ragSection].join("\n\n"),
            repairMessages,
            context || undefined,
          );
          final = repaired.content ?? final;

          const stillBad = containsClarificationPrompt(final);
          const stillWrongQ =
            p.id.toLowerCase() === "kenji" &&
            isAdviceRequest(userMessage) &&
            /[?？]/.test(final) &&
            !/(できそう|選べそう|書けそう|進めそう)/.test(normalizeForMatch(final));

          if (!stillBad && !stillWrongQ) break;
        }

        // Hard fallback if the model keeps leaking clarification questions.
        const tooGenericForWorkFinal =
          stage >= 4 &&
          isManaged &&
          /(深呼吸|夜空|星|旅)/.test(final) &&
          !/(報告|謝罪|確認|連絡|再発防止|チェック|メモ|上司|お客様|注文)/.test(final);

        const mustFallback =
          containsClarificationPrompt(final) ||
          (p.id.toLowerCase() === "kenji" && containsKenjiForbidden(final)) ||
          (p.id.toLowerCase() === "kenji" && stage >= 2 && !/(ジョバンニ|カムパネルラ|ほんとうのさいわい|銀河鉄道)/.test(final)) ||
          (p.id.toLowerCase() === "mirai" &&
            stage >= 4 &&
            workTopic &&
            (!containsWorkAction(final) || !containsMiraiWorkScript(final))) ||
          (p.id.toLowerCase() === "mirai" && shouldUseRagThisTurn && stage >= 3 && !/『[^』]{6,}』/.test(final)) ||
          (tooGenericForWorkFinal && isAdviceRequest(userMessage));

        if (mustFallback) {
          if (
            p.id.toLowerCase() === "kenji" ||
            p.id.toLowerCase() === "mitsu" ||
            p.id.toLowerCase() === "mirai"
          ) {
            if (isManaged && (stage === 1 || stage === 2)) {
              final = buildForcedInterviewReply({
                counselorId: p.id.toLowerCase() as "kenji" | "mitsu" | "mirai",
                stage,
                scopedHistory,
              });
            } else {
              final = buildForcedManagedReply({
                counselorId: p.id.toLowerCase() as "kenji" | "mitsu" | "mirai",
                stage: stage === 3 ? 3 : 4,
                scopedHistory,
                ragContext: context || undefined,
              });
            }
          }
        }
      }

      if (p.id.toLowerCase() === "mirai" && stage >= 3) {
        const nextQuote = extractQuotedPhrases(final)[0];
        if (nextQuote) {
          const nextKey = normalizeForMatch(cleanRagSnippetForQuote(nextQuote)).slice(0, 18);
          const priorKeys = new Set(
            scopedHistory
              .filter((m) => m.role === "assistant")
              .flatMap((m) => extractQuotedPhrases(String(m.content ?? "")))
              .map((q) => normalizeForMatch(cleanRagSnippetForQuote(q)).slice(0, 18))
              .filter(Boolean),
          );

          if (nextKey && priorKeys.has(nextKey)) {
            final = buildForcedManagedReply({
              counselorId: "mirai",
              stage: stage >= 4 ? 4 : 3,
              scopedHistory,
              ragContext: context || undefined,
            });
          }
        }
      }

      const mustUseRag = shouldUseRagThisTurn;
      const ragSeemsUsed =
        p.id.toLowerCase() === "mirai" || p.id.toLowerCase() === "nana"
          ? seemsToUseRagByQuote(final, context || undefined)
          : seemsToUseRag(final, context || undefined);
      if (mustUseRag && !ragSeemsUsed) {
        const avoidQuotes = scopedHistory
          .filter((m) => m.role === "assistant")
          .slice(-10)
          .flatMap((m) => extractQuotedPhrases(String(m.content ?? "")));
        const snippet =
          p.id.toLowerCase() === "mirai" || p.id.toLowerCase() === "nana"
            ? pickRagSnippetAvoidingRepeat({ ragContext: context || undefined, maxLen: 90, avoidQuotes })
            : extractRagSnippet(context || undefined, 90);
        if (snippet) {
          const repairSystem = [
            priorityGuards,
            "【再生成（必須）】参考情報（RAG）の反映が不足しています。次の条件でユーザーに返す最終回答だけを書き直してください。",
            "- 次の一節を『』で1回だけ引用する（出典名・ソース番号は言わない）",
            "- 引用の意味を自分の言葉で言い換えて、ユーザーの状況に結びつける",
            "- 説教や一般論だけで終わらない",
          ]
            .filter(Boolean)
            .join("\n");

          const repairMessages: ChatMessage[] = [
            ...historyMessages,
            { role: "assistant", content: final },
            {
              role: "user",
              content: `上の返答を、次の一節を必ず引用して作り直して：『${snippet}』`,
            },
          ];

          const repaired = await callLLMWithHistory(
            p.provider,
            p.model,
            [repairSystem, p.systemPrompt + teamInstructions + ragSection].join("\n\n"),
            repairMessages,
            shouldUseRagThisTurn ? context || undefined : undefined,
          );
          final = repaired.content ?? final;

          if (
            p.id.toLowerCase() === "nana" &&
            !seemsToUseRagByQuote(final, context || undefined)
          ) {
            final = buildForcedRagReplyNana({ scopedHistory, snippet });
          }
        }
      }

      if (p.id.toLowerCase() === "nana" && mustUseRag && context?.trim()) {
        const nextQuote = extractQuotedPhrases(final)[0];
        const nextKey = nextQuote
          ? normalizeForMatch(cleanRagSnippetForQuote(nextQuote)).slice(0, 18)
          : "";
        const priorKeys = new Set(
          scopedHistory
            .filter((m) => m.role === "assistant")
            .flatMap((m) => extractQuotedPhrases(String(m.content ?? "")))
            .map((q) => normalizeForMatch(cleanRagSnippetForQuote(q)).slice(0, 18))
            .filter(Boolean),
        );

        if (
          !nextQuote ||
          !seemsToUseRagByQuote(final, context || undefined) ||
          (nextKey && priorKeys.has(nextKey))
        ) {
          const snippet = pickRagSnippetAvoidingRepeat({
            ragContext: context || undefined,
            maxLen: 90,
            avoidQuotes: scopedHistory
              .filter((m) => m.role === "assistant")
              .slice(-10)
              .flatMap((m) => extractQuotedPhrases(String(m.content ?? ""))),
          });
          if (snippet) {
            final = buildForcedRagReplyNana({ scopedHistory, snippet });
          }
        }
      }

      const sanitized = sanitizeContent(final, p.name);

      return { author: p.name, authorId: p.id, content: sanitized, iconUrl: p.iconUrl };
    });

    // Promise.allSettled を使用して、一部のAIが失敗しても他のAIの応答を返す
    const results = await Promise.allSettled(responsePromises);
    const responses = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const p = selected[index];
        console.error(`[Team] AI ${p.name} failed:`, result.reason);
        return {
          author: p.name,
          authorId: p.id,
          content: "申し訳ございません。現在応答できません。しばらくしてから再度お試しください。",
          iconUrl: p.iconUrl,
        };
      }
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("team respond error", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
