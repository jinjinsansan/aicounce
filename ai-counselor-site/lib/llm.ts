const PLACEHOLDER =
  "LLM APIキーが設定されていないため、デモ応答を返します。設定後に再度お試しください。";

function buildPrompt(
  systemPrompt: string,
  userMessage: string,
  ragContext?: string,
) {
  if (ragContext) {
    return `${systemPrompt}\n\n[参考コンテキスト]\n${ragContext}\n\n[相談内容]\n${userMessage}`;
  }
  return `${systemPrompt}\n\n[相談内容]\n${userMessage}`;
}

type LLMResponse = {
  content: string;
  tokensUsed?: number;
};

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch (error) {
    console.error("Failed to parse LLM response", error);
    return null;
  }
}

export async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  ragContext?: string,
  model = "gpt-4o-mini",
): Promise<LLMResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return { content: PLACEHOLDER };
  }

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
        { role: "user", content: ragContext ? `${ragContext}\n\n${userMessage}` : userMessage },
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

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  ragContext?: string,
  model = "claude-3-sonnet-20240229",
): Promise<LLMResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { content: PLACEHOLDER };
  }

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
      messages: [
        {
          role: "user",
          content: ragContext ? `${ragContext}\n\n${userMessage}` : userMessage,
        },
      ],
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

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  ragContext?: string,
  model = "gemini-1.5-pro",
): Promise<LLMResponse> {
  if (!process.env.GOOGLE_API_KEY) {
    return { content: PLACEHOLDER };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildPrompt(systemPrompt, userMessage, ragContext),
              },
            ],
          },
        ],
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

export async function callDeepseek(
  systemPrompt: string,
  userMessage: string,
  ragContext?: string,
  model = "deepseek-chat",
): Promise<LLMResponse> {
  if (!process.env.DEEPSEEK_API_KEY) {
    return { content: PLACEHOLDER };
  }

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
        { role: "user", content: ragContext ? `${ragContext}\n\n${userMessage}` : userMessage },
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

export async function callLLM(
  provider: string,
  modelName: string,
  systemPrompt: string,
  userMessage: string,
  ragContext?: string,
): Promise<LLMResponse> {
  switch (provider) {
    case "gemini":
      return callGemini(systemPrompt, userMessage, ragContext, modelName);
    case "claude":
      return callClaude(systemPrompt, userMessage, ragContext, modelName);
    case "deepseek":
      return callDeepseek(systemPrompt, userMessage, ragContext, modelName);
    case "openai":
    default:
      return callOpenAI(systemPrompt, userMessage, ragContext, modelName);
  }
}

export type { LLMResponse };
