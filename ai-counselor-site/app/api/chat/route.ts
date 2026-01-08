import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { fetchCounselorById } from "@/lib/counselors";
import { callLLMWithHistory, type ChatMessage } from "@/lib/llm";
import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";
import { searchRagContext } from "@/lib/rag";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getDefaultCounselorPrompt } from "@/lib/prompts/counselorPrompts";
import { assertAccess, parseAccessError } from "@/lib/access-control";
import { incrementCounselorSessionCount } from "@/lib/counselor-stats";

function normalizeForMatch(value?: string) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[、。！？!?:：\-–—…「」『』（）()【】\[\]<>#]/g, "");
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
    .replace(/\s*#{2,}\s*/g, " ")
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

function pickRagQuoteSentenceAvoidingRepeat(params: {
  ragContext?: string;
  maxLen?: number;
  avoidQuotes?: Array<string | null | undefined> | null;
}) {
  const { ragContext, maxLen = 90, avoidQuotes } = params;
  const raw = String(ragContext ?? "");
  if (!raw.trim()) return "";

  const cleaned = raw
    .replace(/\[ソース\s*\d+\][^\n]*\n/g, "")
    .replace(/\(score:[^)]+\)/g, "")
    .replace(/^#+\s+.*$/gmu, "")
    .replace(/^##\s*キーワード.*$/gmu, "")
    .replace(/^\s*キーワード\s*[:：].*$/gmu, "")
    .replace(/#+/g, " ");

  const sentenceMatches = cleaned.match(/[^\n。！？?!]{6,}[。！？?!]/g) ?? [];
  const sentenceCandidates = sentenceMatches
    .map((s) => cleanRagSnippetForQuote(s))
    .map((s) => s.slice(0, maxLen))
    .filter((s) => s.length >= 10);

  const paraCandidates = cleaned
    .split(/\n\n+/)
    .map((s) => cleanRagSnippetForQuote(s))
    .filter((s) => s.length >= 10);

  const avoidNorms = new Set(
    (avoidQuotes ?? [])
      .filter((q): q is string => typeof q === "string" && q.length > 0)
      .map((q) => normalizeForMatch(cleanRagSnippetForQuote(q)).slice(0, 18))
      .filter(Boolean),
  );

  const pickFrom = sentenceCandidates.length > 0 ? sentenceCandidates : paraCandidates;
  const notRepeat = (c: string) => {
    if (avoidNorms.size === 0) return true;
    const candNorm = normalizeForMatch(c).slice(0, 18);
    return candNorm && !avoidNorms.has(candNorm);
  };

  const picked = pickFrom.find(notRepeat) ?? pickFrom[0] ?? "";
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
  historyMessages: ChatMessage[];
  snippet: string;
}) {
  const { historyMessages, snippet } = params;
  const recentUserText = historyMessages
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-3)
    .map((m) => m.content.trim())
    .join(" / ")
    .slice(0, 160);

  const quote = cleanRagSnippetForQuote(snippet);
  return [
    `『${quote}』`,
    `いまは不安が強いと思います。仕事の問題だけで自分を裁くより、生活全体（睡眠・食事・相談先など）の土台も同時に整えると、持ち直しやすくなります。`,
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
  counselorId: "mitsu" | "kenji" | "mirai" | "nana";
  stage: 1 | 2;
  historyMessages: ChatMessage[];
}) {
  const { counselorId, stage, historyMessages } = params;
  const recentUserFacts = historyMessages
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
    const summary = "つらかったね。";
    if (stage === 1) {
      return `${summary}\n何がきっかけで𠮟られたのか、教えてくれる？`;
    }
    return `${summary}\nいちばん苦しいのは、叱られた言い方？ミスの不安？クビの不安？`;
  }

  if (counselorId === "nana") {
    const summary = "それはとてもおつらいですね。";
    if (stage === 1) {
      return `${summary}\n何について叱られたのか、差し支えない範囲で教えてください。`;
    }
    return `${summary}\nいちばん苦しいのは、『評価』と『今後の対応』のどちらですか？`;
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

function isGreetingOnly(message: string): boolean {
  const greetings = [
    "こんにちは",
    "こんばんは",
    "おはよう",
    "はじめまして",
    "よろしく",
    "hello",
    "hi",
    "hey",
  ];
  const normalized = message.toLowerCase().trim().replace(/[、。！？!?\s]/g, "");
  return greetings.some((g) => normalized === g || normalized === g + "ございます");
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
  historyMessages: ChatMessage[];
  userMessage: string;
}) {
  const { counselorId, historyMessages, userMessage } = params;
  const managed =
    counselorId === "mitsu" || counselorId === "kenji" || counselorId === "mirai" || counselorId === "nana";
  if (!managed) return { stage: 0 as const, guard: "" };

  if (isGreetingOnly(userMessage)) {
    return { stage: 0 as const, guard: "" };
  }

  const priorNonGreetingUserCount = historyMessages.filter(
    (m) => m.role === "user" && !isGreetingOnly(m.content),
  ).length;

  const last = historyMessages[historyMessages.length - 1];
  const alreadyIncludesCurrent =
    last?.role === "user" && normalizeForMatch(last.content) === normalizeForMatch(userMessage);
  const currentNonGreetingUserCount = alreadyIncludesCurrent
    ? priorNonGreetingUserCount
    : priorNonGreetingUserCount + 1;

  const historyUserText = historyMessages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  const detailKnown = hasWorkDetail(historyUserText) || hasWorkDetail(userMessage);

  let stage = Math.min(4, Math.max(1, currentNonGreetingUserCount));
  if (isAdviceRequest(userMessage)) stage = 4;
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
            : counselorId === "nana"
              ? "- 返答は短く：共感1行 + 事実確認の質問1つだけ（状況確認）"
            : "- 返答は短く：共感1行 + 質問1つだけ",
        "- ここでは助言/解決策/RAG引用は禁止",
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
            : counselorId === "nana"
              ? "- 感情/影響をたずねる質問は1つだけ（例：『いちばんつらいのは？』）"
            : "- 感情/影響/背景をたずねる質問は1つだけ",
      ].join("\n"),
    };
  }

  if (stage === 3) {
    return {
      stage,
      guard: [
        "【進行（強制）】いまはステップ3（RAGで解放・気づき）。",
        "- RAG要素を1つ必ず入れて、視点転換を1つ提示",
        counselorId === "mirai" || counselorId === "nana"
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
      counselorId === "mirai" || counselorId === "nana"
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

function pickManagedCheckInQuestion(counselorId: "mitsu" | "kenji" | "mirai" | "nana", seed: string) {
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
          : counselorId === "nana"
            ? [
                "ここまでの整理で合っていますか？",
                "この次の一手、いま実行できそうですか？",
                "まずは一つだけ、試せそうですか？",
                "いま一番ほしいのは、安心？具体策？",
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

function summarizeMitsuFromHistory(historyMessages: ChatMessage[]) {
  const t = historyMessages
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-4)
    .map((m) => m.content)
    .join("\n");

  if (/言い方/.test(t)) return "叱られた言い方がきつかったんだね。";
  if (/(注文|失念|忘れ)/.test(t)) return "注文のことで叱られて、胸が苦しいんだね。";
  if (/(クビ|解雇)/.test(t)) return "クビになるかもって不安なんだね。";
  return "上司に𠮟られて胸が苦しいんだね。";
}

function summarizeKenjiFromHistory(historyMessages: ChatMessage[]) {
  const t = historyMessages
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-4)
    .map((m) => m.content)
    .join("\n");

  if (/言い方/.test(t)) return "叱られた言い方がきつかったんだね。";
  if (/(注文|失念|忘れ)/.test(t)) return "注文を忘れて叱られて、胸が苦しいんだね。";
  if (/(クビ|解雇)/.test(t)) return "クビになるかもって不安なんだね。";
  return "上司に𠮟られて胸が苦しいんだね。";
}

function summarizeMiraiFromHistory(historyMessages: ChatMessage[]) {
  const t = historyMessages
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-4)
    .map((m) => m.content)
    .join("\n");

  if (/言い方/.test(t)) return "叱られた言い方がきつくて、苦しいんだね。";
  if (/(クビ|解雇)/.test(t)) return "クビになるかもって不安で、胸が苦しいんだね。";
  return "上司に𠮟られて、胸が苦しいんだね。";
}

function summarizeNanaFromHistory(historyMessages: ChatMessage[]) {
  const t = historyMessages
    .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
    .slice(-4)
    .map((m) => m.content)
    .join("\n");

  if (/(クビ|解雇)/.test(t)) return "解雇になるかもしれない不安が強いのですね。";
  if (/言い方/.test(t)) return "叱られた言い方がきつくて、おつらいのですね。";
  return "上司に叱られて苦しいのですね。";
}

function buildForcedManagedReply(params: {
  counselorId: "mitsu" | "kenji" | "mirai" | "nana";
  stage: 3 | 4;
  historyMessages: ChatMessage[];
  ragContext?: string;
}) {
  const { counselorId, stage, historyMessages, ragContext } = params;
  const recentUserFacts = historyMessages
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

  const avoidQuotes = historyMessages
    .filter((m) => m.role === "assistant")
    .slice(-10)
    .flatMap((m) => extractQuotedPhrases(String(m.content ?? "")));

  const cleanedRagRaw =
    counselorId === "mirai"
      ? pickRagSnippetAvoidingRepeat({ ragContext, maxLen: 90, avoidQuotes })
      : counselorId === "nana"
        ? pickRagQuoteSentenceAvoidingRepeat({ ragContext, maxLen: 90, avoidQuotes })
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
        : counselorId === "nana"
          ? `『${cleanRagSnippetForQuote(cleanedRag)}』`
        : `ことばにするとね、こんなのがあるよ。『${cleanedRag}』`
    : counselorId === "kenji"
      ? "ジョバンニも迷いながら『ほんとうのさいわい』を探して、まず一歩を選び直したんだ。"
      : counselorId === "mirai"
        ? "いまは視点を少しだけ変えるヒントがほしいところだよね。"
        : counselorId === "nana"
          ? "いまは視点を少しだけ変えるヒントがほしいところですね。"
        : "きみの今のしんどさも、にんげんらしさの一部なんだよ。";

  const summary =
    counselorId === "mitsu"
      ? summarizeMitsuFromHistory(historyMessages)
      : counselorId === "mirai"
        ? summarizeMiraiFromHistory(historyMessages)
        : counselorId === "nana"
          ? summarizeNanaFromHistory(historyMessages)
        : summarizeKenjiFromHistory(historyMessages);

  if (stage === 3) {
    if (!cleanedRag) {
      const question =
        counselorId === "kenji"
          ? "いま一番こわいのは、何が起きること？"
          : "いま一番こわいのは、何が起きること？";
      return `${summary}\n${question}`;
    }

    const question =
      counselorId === "kenji"
        ? "その言葉のどこが、いまのきみに一番刺さる？"
        : counselorId === "mirai"
          ? "いま一番こわいのは、クビ？評価？それとも上司の目？"
        : counselorId === "nana"
          ? "この言葉のどこが、いまの不安と一番つながっていますか？"
        : "この言葉のどこが、いまのきみに一番重なる？";
    return `${summary}\n${ragLine}\n${question}`;
  }

  const workTopic = isWorkTopic(recentUserFacts);
  const action =
    counselorId === "kenji"
      ? "3分だけ、上司に伝える一文をメモしてみよう：『叱責のポイント→自分の理解→次の対策→確認したいこと』。"
      : counselorId === "mirai"
        ? "3分だけでいいよ。上司に確認する一文を下書きしてみよう：『ご指摘の点は○○と理解しました。今後は△△で防ぎます。優先順位だけ確認させてください』。"
        : counselorId === "nana"
          ? workTopic
            ? "3分だけで大丈夫です。上司に伝える一文を下書きしましょう：『ご指摘ありがとうございます。理解しました。今後は○○を確認して再発防止します』。"
            : "3分だけで大丈夫です。いまの不安を紙に3行だけ書き出して、『事実』と『想像』を分けてみましょう。"
      : "3分だけ、次の一手をメモしてみない？『何が起きた→いま出来る対応→次の防止策1つ』。";

  const questionSeed = `${counselorId}|${recentUserFacts}|${cleanedRag ?? ""}`;
  return `${summary}\n${ragLine}\n${action}\n${pickManagedCheckInQuestion(counselorId, questionSeed)}`;
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      counselorId,
      conversationId,
      useRag,
    } = await request.json();

    if (!message || !counselorId) {
      return NextResponse.json(
        { error: "message and counselorId are required" },
        { status: 400 },
      );
    }

    const counselor = await fetchCounselorById(counselorId);
    if (!counselor) {
      return NextResponse.json({ error: "Counselor not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseRouteClient(cookieStore);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = hasServiceRole() ? getServiceSupabase() : null;

    try {
      await assertAccess(session.user.id, "individual", session.user.email ?? null);
    } catch (error) {
      const { status, message } = parseAccessError(error);
      if (status === 402) {
        return NextResponse.json({ error: message }, { status });
      }
      console.error("access check failed", error);
      return NextResponse.json({ error: "Access denied" }, { status });
    }

    let activeConversationId = conversationId ?? null;

    if (adminSupabase) {
      const userEmail = session.user.email ?? `${session.user.id}@example.com`;
      try {
        await adminSupabase
          .from("users")
          .upsert(
            {
              id: session.user.id,
              email: userEmail,
              username:
                session.user.user_metadata?.full_name ?? session.user.email ?? "User",
            },
            { onConflict: "id" },
          );
      } catch (error) {
        console.error("Failed to upsert user profile", error);
      }
    }

    if (activeConversationId) {
      const { error } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", activeConversationId)
        .single();
      if (error) {
        console.warn("Conversation not found, creating new one:", activeConversationId);
        activeConversationId = null;
      }
    }

    if (!activeConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert([
          {
            user_id: session.user.id,
            counselor_id: counselorId,
            title: message.trim().slice(0, 60) || `${counselor.name}との相談`,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        activeConversationId = data.id;
        if (adminSupabase) {
          await incrementCounselorSessionCount(counselorId, adminSupabase);
        }
      }
    }

    let assistantMessageId: string | null = null;
    if (activeConversationId) {
      await supabase.from("messages").insert([
        {
          conversation_id: activeConversationId,
          role: "user",
          content: message,
        },
      ]);
    }

    let historyMessages: ChatMessage[] = [{ role: "user", content: message }];
    if (activeConversationId) {
      const { data, error } = await supabase
        .from("messages")
        .select("role, content, created_at")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && Array.isArray(data) && data.length > 0) {
        historyMessages = data
          .slice()
          .reverse()
          .map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role,
            content: m.content,
          }));
      }
    }

    const managed =
      counselor.id === "mitsu" || counselor.id === "kenji" || counselor.id === "mirai" || counselor.id === "nana";
    const isGreetingMessage = isGreetingOnly(message);

    const { stage, guard: stageGuard } = buildStageGuard({
      counselorId: String(counselor.id),
      historyMessages,
      userMessage: message,
    });

    const effectiveUseRag = Boolean(
      counselor.ragEnabled && (useRag || (counselor.id === "mirai" && stage >= 3)),
    );

    let ragContext: string | undefined;
    let ragSources: { id: string; chunk_text: string; similarity: number }[] = [];
    let ragDurationMs: number | null = null;

    const ragQueryBase = historyMessages
      .filter((m) => m.role === "user" && !isGreetingOnly(m.content))
      .slice(-3)
      .map((m) => m.content)
      .join("\n")
      .trim() || message;

    const ragQuery =
      counselor.id === "kenji"
        ? `${ragQueryBase}\n\n銀河鉄道の夜 ジョバンニ カムパネルラ ほんとうのさいわい`
        : counselor.id === "mitsu"
          ? `${ragQueryBase}\n\n相田みつを にんげんだもの 書`
          : ragQueryBase;

    if (effectiveUseRag) {
      const ragStart =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      const ragResult = await searchRagContext(counselorId, ragQuery);
      ragContext = ragResult.context || undefined;
      ragSources = ragResult.sources;

      // Kenji: prefer 銀河鉄道の夜 anchors and avoid 雨ニモマケズ content.
      if (counselor.id === "kenji" && ragSources.length > 0) {
        const filtered = ragSources.filter(
          (s) => hasKenjiAnchor(s.chunk_text) && !containsKenjiForbidden(s.chunk_text),
        );
        if (filtered.length > 0) {
          ragSources = filtered.slice(0, 5);
          ragContext = buildRagContextFromSources(ragSources);
        }
      }

      if (counselor.id === "mitsu" && ragSources.length > 0) {
        const filtered = ragSources.filter(
          (s) => hasMitsuAnchor(s.chunk_text) && !containsMitsuForbidden(s.chunk_text),
        );
        if (filtered.length > 0) {
          ragSources = filtered.slice(0, 5);
          ragContext = buildRagContextFromSources(ragSources);
        }
      }
      const ragEnd =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      ragDurationMs = Math.round(ragEnd - ragStart);
      if (ragSources.length > 0) {
        console.info(
          `[RAG] counselor=${counselorId} chunks=${ragSources.length} duration=${ragDurationMs}ms`,
        );
      }
    }

    const baseSystemPrompt =
      getDefaultCounselorPrompt(counselor.id) ??
      counselor.systemPrompt ??
      "You are a supportive counselor who responds in Japanese with empathy and actionable advice.";

    const shouldUseRagThisTurn = Boolean(
      effectiveUseRag &&
        counselor.ragEnabled &&
        ragContext?.trim() &&
        !isGreetingMessage &&
        (!managed || stage >= 3),
    );

    const finalSystemPrompt = shouldUseRagThisTurn
      ? `${baseSystemPrompt}

[RAG活用ルール]
- 直近で提供された参考情報を必ず読み、要約や言い換えを交えて回答してください
- 参考情報に含まれる支援策や表現を優先的に取り入れ、ユーザーの状況に合わせて説明してください
- 参考情報と質問がずれている場合は、その旨を一言添えたうえで一般的な助言も補ってください
- 参考情報をそのまま読み上げず、会話調で温かく伝えてください`
      : baseSystemPrompt;

    const guardedSystemPrompt = stageGuard
      ? [stageGuard, finalSystemPrompt].join("\n\n")
      : finalSystemPrompt;

    const { content, tokensUsed } = await callLLMWithHistory(
      counselor.modelType ?? "openai",
      counselor.modelName ?? "gpt-4o-mini",
      guardedSystemPrompt,
      historyMessages,
      shouldUseRagThisTurn ? ragContext : undefined,
    );

    let finalContent = content;
    const mustNotClarify =
      managed && !isQuoteClarificationRequest(message) && (stage >= 2 || isAdviceRequest(message));

    if (managed && !isGreetingMessage && !isAdviceRequest(message) && (stage === 1 || stage === 2)) {
      const hasQuote = /『[^』]+』/.test(finalContent);
      const hasQuestion = /[?？]/.test(finalContent);
      const suggestsAction = /(してみない|やってみない|メモして|試してみ|行動|再発防止|報告|謝罪)/.test(
        finalContent,
      );

      const isMitsu = counselor.id === "mitsu";
      const isKenji = counselor.id === "kenji";
      const mitsQuestionIsNotFact =
        isMitsu && stage === 1 && hasQuestion && !isMitsuFactQuestion(finalContent);
      const mitsQuestionIsNotFeeling =
        isMitsu && stage === 2 && hasQuestion && !isMitsuFeelingQuestion(finalContent);
      const kenjiQuestionIsNotFact =
        isKenji && stage === 1 && hasQuestion && !isKenjiFactQuestion(finalContent);
      const kenjiQuestionIsNotFeeling =
        isKenji && stage === 2 && hasQuestion && !isKenjiFeelingQuestion(finalContent);

      const needsInterviewRepair =
        hasQuote ||
        !hasQuestion ||
        suggestsAction ||
        (stage === 2 && /(どんなことがあった|具体的に教えて)/.test(finalContent)) ||
        mitsQuestionIsNotFact ||
        mitsQuestionIsNotFeeling ||
        kenjiQuestionIsNotFact ||
        kenjiQuestionIsNotFeeling;

      if (needsInterviewRepair) {
        const repairSystem = [
          stageGuard,
          baseSystemPrompt,
          stage === 1
            ? [
                "【再生成（必須）】いまはステップ1（インタビュー）。次の条件で、ユーザーに返す最終回答だけを書き直してください。",
                "- 共感は1行だけ",
                counselor.id === "mitsu"
                  ? "- 質問は事実確認の1つだけ（例：『叱られたのは何について？（注文/対応/態度/遅れのどれ？）』）"
                  : "- 質問は1つだけ（例：『叱られたのは何について？』『何と言われた？』『どの場面？』）",
                "- 助言/解決策/行動提案は禁止",
                "- RAG引用（『』）は禁止",
              ].join("\n")
            : [
                "【再生成（必須）】いまはステップ2（展開＆掘り下げ）。次の条件で、ユーザーに返す最終回答だけを書き直してください。",
                "- 既に聞いた事実を1行で要約",
                counselor.id === "mitsu"
                  ? "- 感情/影響をたずねる質問は1つだけ（例：『いちばん苦しいのは、叱られた言い方？ミスへの罪悪感？クビの不安？』）"
                  : "- 感情/影響をたずねる質問は1つだけ",
                "- 事実の聞き直し（『どんなことがあった』等）は禁止",
                "- 助言/解決策/行動提案は禁止",
                "- RAG引用（『』）は禁止",
              ].join("\n"),
        ]
          .filter(Boolean)
          .join("\n\n");

        const repairMessages: ChatMessage[] = [
          ...historyMessages,
          { role: "assistant", content: finalContent },
          { role: "user", content: "上の返答を、指定ルールどおりに短く自然な日本語で書き直して。" },
        ];

        const repaired = await callLLMWithHistory(
          counselor.modelType ?? "openai",
          counselor.modelName ?? "gpt-4o-mini",
          repairSystem,
          repairMessages,
          undefined,
        );
        finalContent = repaired.content ?? finalContent;

        const stillHasQuote = /『[^』]+』/.test(finalContent);
        const stillHasQuestion = /[?？]/.test(finalContent);
        const stillSuggestsAction = /(してみない|やってみない|メモして|試してみ|行動|再発防止|報告|謝罪)/.test(
          finalContent,
        );
        const stillBadMitsuQ =
          counselor.id === "mitsu" &&
          ((stage === 1 && stillHasQuestion && !isMitsuFactQuestion(finalContent)) ||
            (stage === 2 && stillHasQuestion && !isMitsuFeelingQuestion(finalContent)));
        const stillBadKenjiQ =
          counselor.id === "kenji" &&
          ((stage === 1 && stillHasQuestion && !isKenjiFactQuestion(finalContent)) ||
            (stage === 2 && stillHasQuestion && !isKenjiFeelingQuestion(finalContent)));

        if (stillHasQuote || !stillHasQuestion || stillSuggestsAction || stillBadMitsuQ || stillBadKenjiQ) {
          finalContent = buildForcedInterviewReply({
            counselorId: counselor.id as "mitsu" | "kenji" | "mirai" | "nana",
            stage,
            historyMessages,
          });
        }
      }
    }

    const stage3SuggestsAction =
      managed &&
      stage === 3 &&
      /(してみない|やってみない|メモして|試してみ|行動|再発防止|報告|謝罪)/.test(finalContent);
    if (stage3SuggestsAction) {
      finalContent = buildForcedManagedReply({
        counselorId: counselor.id as "mitsu" | "kenji" | "mirai" | "nana",
        stage: 3,
        historyMessages,
        ragContext,
      });
    }
    const tooGenericForWork =
      managed &&
      stage >= 4 &&
      /(深呼吸|夜空|星|旅)/.test(finalContent) &&
      !/(報告|謝罪|確認|連絡|再発防止|チェック|メモ|上司|お客様|注文)/.test(finalContent);

    const recentUserText = historyMessages
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => m.content)
      .join("\n");
    const workTopic = isWorkTopic(`${recentUserText}\n${message}`);
    const mitsMissingWorkAction =
      counselor.id === "mitsu" && stage >= 4 && workTopic && !containsWorkAction(finalContent);

    const kenjiMissingWorkAction =
      counselor.id === "kenji" && stage >= 4 && workTopic && !containsWorkAction(finalContent);

    const miraiMissingWorkAction =
      counselor.id === "mirai" &&
      stage >= 4 &&
      workTopic &&
      (!containsWorkAction(finalContent) || !containsMiraiWorkScript(finalContent));

    const nanaMissingWorkAction =
      counselor.id === "nana" && stage >= 4 && workTopic && !containsWorkAction(finalContent);

    const mitsForbidden = counselor.id === "mitsu" && containsMitsuForbidden(finalContent);

    const kenjiOtherWork = counselor.id === "kenji" && containsKenjiForbidden(finalContent);
    const kenjiMissingAnchor =
      counselor.id === "kenji" &&
      stage >= 2 &&
      !/(ジョバンニ|カムパネルラ|ほんとうのさいわい|銀河鉄道)/.test(finalContent);

    const mustHaveRealQuote =
      counselor.id === "mitsu" &&
      shouldUseRagThisTurn &&
      stage >= 3 &&
      !/『[^』]{6,}』/.test(finalContent);

    const miraiMustHaveRealQuote =
      counselor.id === "mirai" &&
      shouldUseRagThisTurn &&
      stage >= 3 &&
      !/『[^』]{6,}』/.test(finalContent);

    const nanaMustHaveRealQuote =
      counselor.id === "nana" &&
      shouldUseRagThisTurn &&
      stage >= 3 &&
      !/『[^』]{6,}』/.test(finalContent);

    if (counselor.id === "kenji" && isGreetingMessage && kenjiOtherWork) {
      finalContent =
        "おはよう。銀河鉄道の夜のように、静かに聴くね。いま一番胸が苦しいのは、どんなところ？";
    }


    if (
      (mustNotClarify && containsClarificationPrompt(finalContent)) ||
      tooGenericForWork ||
      (!isGreetingMessage && kenjiOtherWork) ||
      kenjiMissingAnchor ||
      mitsMissingWorkAction ||
      kenjiMissingWorkAction ||
      miraiMissingWorkAction ||
      nanaMissingWorkAction ||
      mitsForbidden ||
      mustHaveRealQuote ||
      miraiMustHaveRealQuote ||
      nanaMustHaveRealQuote
    ) {
      if (managed && (stage === 1 || stage === 2)) {
        finalContent = buildForcedInterviewReply({
          counselorId: counselor.id as "mitsu" | "kenji" | "mirai" | "nana",
          stage,
          historyMessages,
        });
      } else {
        finalContent = buildForcedManagedReply({
          counselorId: counselor.id as "mitsu" | "kenji" | "mirai" | "nana",
          stage: stage === 3 ? 3 : 4,
          historyMessages,
          ragContext,
        });
      }
    }

    if (counselor.id === "mirai" && stage >= 3) {
      const nextQuote = extractQuotedPhrases(finalContent)[0];
      if (nextQuote) {
        const nextKey = normalizeForMatch(cleanRagSnippetForQuote(nextQuote)).slice(0, 18);
        const priorKeys = new Set(
          historyMessages
            .filter((m) => m.role === "assistant")
            .flatMap((m) => extractQuotedPhrases(String(m.content ?? "")))
            .map((q) => normalizeForMatch(cleanRagSnippetForQuote(q)).slice(0, 18))
            .filter(Boolean),
        );

        if (nextKey && priorKeys.has(nextKey)) {
          finalContent = buildForcedManagedReply({
            counselorId: "mirai",
            stage: stage >= 4 ? 4 : 3,
            historyMessages,
            ragContext,
          });
        }
      }
    }

    const mustUseRag = shouldUseRagThisTurn;
    const ragSeemsUsed =
      counselor.id === "mirai" || counselor.id === "nana"
        ? seemsToUseRagByQuote(finalContent, ragContext)
        : seemsToUseRag(finalContent, ragContext);
    if (mustUseRag && !ragSeemsUsed) {
      const avoidQuotes = historyMessages
        .filter((m) => m.role === "assistant")
        .slice(-10)
        .flatMap((m) => extractQuotedPhrases(String(m.content ?? "")));
      const snippet =
        counselor.id === "mirai"
          ? pickRagSnippetAvoidingRepeat({ ragContext, maxLen: 90, avoidQuotes })
          : counselor.id === "nana"
            ? pickRagQuoteSentenceAvoidingRepeat({ ragContext, maxLen: 90, avoidQuotes })
          : extractRagSnippet(ragContext, 90);
      if (snippet) {
        const repairSystem = [
          guardedSystemPrompt,
          "【再生成（必須）】参考情報（RAG）を十分に反映できていません。次の条件でユーザーに返す最終回答だけを書き直してください。",
          "- 次の一節を『』で1回だけ引用する（出典名・ソース番号は言わない）",
          "- 引用の意味を自分の言葉で言い換えて、ユーザーの状況に結びつける",
          "- 同じ内容の繰り返しはしない",
        ].join("\n");

        const repairMessages: ChatMessage[] = [
          ...historyMessages,
          { role: "assistant", content: finalContent },
          {
            role: "user",
            content: `上の返答を、次の一節を必ず引用して作り直して：『${snippet}』`,
          },
        ];

        const repaired = await callLLMWithHistory(
          counselor.modelType ?? "openai",
          counselor.modelName ?? "gpt-4o-mini",
          repairSystem,
          repairMessages,
          ragContext,
        );
        finalContent = repaired.content ?? finalContent;

        if (counselor.id === "nana" && !seemsToUseRagByQuote(finalContent, ragContext)) {
          finalContent = buildForcedRagReplyNana({ historyMessages, snippet });
        }
      }
    }

    if (counselor.id === "nana" && mustUseRag && ragContext?.trim()) {
      const nextQuote = extractQuotedPhrases(finalContent)[0];
      const nextKey = nextQuote
        ? normalizeForMatch(cleanRagSnippetForQuote(nextQuote)).slice(0, 18)
        : "";
      const priorKeys = new Set(
        historyMessages
          .filter((m) => m.role === "assistant")
          .flatMap((m) => extractQuotedPhrases(String(m.content ?? "")))
          .map((q) => normalizeForMatch(cleanRagSnippetForQuote(q)).slice(0, 18))
          .filter(Boolean),
      );

      if (!nextQuote || !seemsToUseRagByQuote(finalContent, ragContext) || (nextKey && priorKeys.has(nextKey))) {
        const snippet = pickRagQuoteSentenceAvoidingRepeat({
          ragContext,
          maxLen: 90,
          avoidQuotes: historyMessages
            .filter((m) => m.role === "assistant")
            .slice(-10)
            .flatMap((m) => extractQuotedPhrases(String(m.content ?? ""))),
        });
        if (snippet) {
          finalContent = buildForcedRagReplyNana({ historyMessages, snippet });
        }
      }
    }

    if (activeConversationId) {
      const { data: assistantRows, error: assistantError } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: activeConversationId,
            role: "assistant",
            content: finalContent,
            tokens_used: tokensUsed ?? null,
          },
        ])
        .select()
        .single();

      if (!assistantError && assistantRows) {
        assistantMessageId = assistantRows.id;
      }
    }

    if (adminSupabase && assistantMessageId && ragSources.length > 0) {
      await adminSupabase.from("rag_search_logs").insert([
        {
          message_id: assistantMessageId,
          query: message,
          retrieved_chunks: ragSources,
        },
      ]);
    }

    return NextResponse.json({
      conversationId: activeConversationId ?? counselorId,
      counselorId,
      content: finalContent,
      tokensUsed: tokensUsed ?? 0,
      ragSources,
      ragDurationMs: ragDurationMs ?? 0,
    });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
