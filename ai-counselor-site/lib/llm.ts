const PLACEHOLDER =
  "LLM APIキーが設定されていないため、デモ応答を返します。設定後に再度お試しください。";

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
  if (!ragContext) return messages;
  const cloned = messages.map((message) => ({ ...message }));
  for (let i = cloned.length - 1; i >= 0; i -= 1) {
    if (cloned[i].role === "user") {
      cloned[i] = {
        ...cloned[i],
        content: `${ragContext}\n\n${cloned[i].content}`,
      };
      return cloned;
    }
  }
  cloned.push({ role: "user", content: ragContext });
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
  model = "claude-3-sonnet-20240229",
}: CallOptions): Promise<LLMResponse> {
  console.log("[LLM] ANTHROPIC_API_KEY defined?", !!process.env.ANTHROPIC_API_KEY);
  if (!process.env.ANTHROPIC_API_KEY) {
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

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: preparedMessages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Claude API error", text);
    return { content: PLACEHOLDER };
  }

  const data = await safeJson(response);
  const content = data?.content?.[0]?.text;
  return {
    content: content || PLACEHOLDER,
    tokensUsed:
      (data?.usage?.input_tokens ?? 0) + (data?.usage?.output_tokens ?? 0),
  };
}

export async function callGemini({
  systemPrompt,
  messages,
  ragContext,
  model = "gemini-1.5-pro",
}: CallOptions): Promise<LLMResponse> {
  console.log("[LLM] GOOGLE_API_KEY defined?", !!process.env.GOOGLE_API_KEY);
  if (!process.env.GOOGLE_API_KEY) {
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
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
    console.error("Gemini API error", text);
    return { content: PLACEHOLDER };
  }

  const data = await safeJson(response);
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return { content: content || PLACEHOLDER };
}

export async function callDeepseek({
  systemPrompt,
  messages,
  ragContext,
  model = "deepseek-chat",
}: CallOptions): Promise<LLMResponse> {
  console.log("[LLM] DEEPSEEK_API_KEY defined?", !!process.env.DEEPSEEK_API_KEY);
  if (!process.env.DEEPSEEK_API_KEY) {
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
    console.error("Deepseek API error", text);
    return { content: PLACEHOLDER };
  }

  const data = await safeJson(response);
  const content = data?.choices?.[0]?.message?.content;
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
