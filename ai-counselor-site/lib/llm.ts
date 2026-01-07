const PLACEHOLDER =
  "LLM APIキーが設定されていないため、デモ応答を返します。設定後に再度お試しください。";

const DEFAULT_CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-3-haiku-20240307";
const FALLBACK_CLAUDE_MODEL = process.env.CLAUDE_FALLBACK_MODEL ?? "claude-3-haiku-20240307";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const FALLBACK_GEMINI_MODEL = process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-pro";

type LLMResponse = {
  content: string;
  tokensUsed?: number;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CallOptions = {
  systemPrompt: string;
  messages: ChatMessage[];
  ragContext?: string;
  model?: string;
};

function injectRagContext(messages: ChatMessage[], ragContext?: string) {
  if (!ragContext?.trim()) return messages;
  const formattedContext = ragContext
    .trim()
    .replace(/\s+$/u, "");
  const preface = [
    "【参考情報（RAG）】",
    "以下の専門知識は最新の検索結果です。内容を必ず読み、要点を整理してから回答してください。",
    formattedContext,
    "【参考情報ここまで】",
    "上記を踏まえてユーザーのメッセージに答えてください。",
  ].join("\n");
  const cloned = messages.map((message) => ({ ...message }));
  for (let i = cloned.length - 1; i >= 0; i -= 1) {
    if (cloned[i].role === "user") {
      cloned[i] = {
        ...cloned[i],
        content: `${preface}\n\n${cloned[i].content}`,
      };
      return cloned;
    }
  }
  cloned.push({ role: "user", content: preface });
  return cloned;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    console.error("Failed to parse LLM response", error);
    return null;
  }
}

export async function callOpenAI({
  systemPrompt,
  messages,
  ragContext,
  model = "gpt-4o-mini",
}: CallOptions): Promise<LLMResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return { content: PLACEHOLDER };
  }

  const preparedMessages = injectRagContext(messages, ragContext).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        ...preparedMessages,
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAI API error", text);
    return { content: PLACEHOLDER };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  return {
    content: content || PLACEHOLDER,
    tokensUsed: data.usage?.total_tokens,
  };
}

export async function callClaude({
  systemPrompt,
  messages,
  ragContext,
  model = DEFAULT_CLAUDE_MODEL,
}: CallOptions): Promise<LLMResponse> {
  console.log("[LLM] ANTHROPIC_API_KEY defined?", !!process.env.ANTHROPIC_API_KEY);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[LLM] Claude call aborted: ANTHROPIC_API_KEY missing");
    return { content: PLACEHOLDER };
  }

  const preparedMessages = injectRagContext(messages, ragContext).map((message) => ({
    role: message.role,
    content: [
      {
        type: "text",
        text: message.content,
      },
    ],
  }));
  let currentModel = model;
  let attemptedFallback = false;

  while (true) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: currentModel,
        max_tokens: 1024,
        system: systemPrompt,
        messages: preparedMessages,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `[LLM] Claude API error (${response.status}) model=${currentModel}`,
        text,
      );
      const shouldFallback =
        !attemptedFallback &&
        response.status === 404 &&
        FALLBACK_CLAUDE_MODEL &&
        currentModel !== FALLBACK_CLAUDE_MODEL;

      if (shouldFallback) {
        attemptedFallback = true;
        console.warn(`[LLM] Claude falling back to ${FALLBACK_CLAUDE_MODEL}`);
        currentModel = FALLBACK_CLAUDE_MODEL;
        continue;
      }

      return { content: PLACEHOLDER };
    }

    const data = await safeJson(response);
    const content = data?.content?.[0]?.text;
    if (!content) {
      console.error("[LLM] Claude response missing content", data);
    }
    return {
      content: content || PLACEHOLDER,
      tokensUsed:
        (data?.usage?.input_tokens ?? 0) + (data?.usage?.output_tokens ?? 0),
    };
  }
}

export async function callGemini({
  systemPrompt,
  messages,
  ragContext,
  model = DEFAULT_GEMINI_MODEL,
}: CallOptions): Promise<LLMResponse> {
  console.log("[LLM] GOOGLE_API_KEY defined?", !!process.env.GOOGLE_API_KEY);
  if (!process.env.GOOGLE_API_KEY) {
    console.error("[LLM] Gemini call aborted: GOOGLE_API_KEY missing");
    return { content: PLACEHOLDER };
  }

  const preparedMessages = injectRagContext(messages, ragContext).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [
      {
        text: message.content,
      },
    ],
  }));
  let currentModel = model;
  let attemptedFallback = false;

  while (true) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            role: "system",
            parts: [{ text: systemPrompt }],
          },
          contents: preparedMessages,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(
        `[LLM] Gemini API error (${response.status}) model=${currentModel}`,
        text,
      );
      const shouldFallback =
        !attemptedFallback &&
        response.status === 404 &&
        FALLBACK_GEMINI_MODEL &&
        currentModel !== FALLBACK_GEMINI_MODEL;

      if (shouldFallback) {
        attemptedFallback = true;
        console.warn(`[LLM] Gemini falling back to ${FALLBACK_GEMINI_MODEL}`);
        currentModel = FALLBACK_GEMINI_MODEL;
        continue;
      }

      return { content: PLACEHOLDER };
    }

    const data = await safeJson(response);
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      console.error("[LLM] Gemini response missing content", data);
    }
    return { content: content || PLACEHOLDER };
  }
}

export async function callDeepseek({
  systemPrompt,
  messages,
  ragContext,
  model = "deepseek-chat",
}: CallOptions): Promise<LLMResponse> {
  console.log("[LLM] DEEPSEEK_API_KEY defined?", !!process.env.DEEPSEEK_API_KEY);
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("[LLM] Deepseek call aborted: DEEPSEEK_API_KEY missing");
    return { content: PLACEHOLDER };
  }

  const preparedMessages = injectRagContext(messages, ragContext).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...preparedMessages,
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[LLM] Deepseek API error (${response.status})`, text);
    return { content: PLACEHOLDER };
  }

  const data = await safeJson(response);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[LLM] Deepseek response missing content", data);
  }
  return {
    content: content || PLACEHOLDER,
    tokensUsed: data?.usage?.total_tokens,
  };
}

export async function callLLMWithHistory(
  provider: string,
  modelName: string,
  systemPrompt: string,
  messages: ChatMessage[],
  ragContext?: string,
): Promise<LLMResponse> {
  const options: CallOptions = {
    systemPrompt,
    messages,
    ragContext,
    model: modelName,
  };

  switch (provider) {
    case "gemini":
      return callGemini(options);
    case "claude":
      return callClaude(options);
    case "deepseek":
      return callDeepseek(options);
    case "openai":
    default:
      return callOpenAI(options);
  }
}

export async function callLLM(
  provider: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string,
  ragContext?: string,
): Promise<LLMResponse> {
  return callLLMWithHistory(provider, modelName, systemPrompt, [{ role: "user", content: userMessage }], ragContext);
}

export type { LLMResponse };
