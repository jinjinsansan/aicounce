/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "../route";

jest.mock("@/lib/counselors", () => ({
  fetchCounselorById: jest.fn(),
}));

jest.mock("@/lib/llm", () => ({
  callLLM: jest.fn(),
}));

jest.mock("@/lib/rag", () => ({
  searchRagContext: jest.fn(),
}));

jest.mock("@/lib/supabase-server", () => ({
  hasServiceRole: jest.fn(),
  getServiceSupabase: jest.fn(),
}));

const { fetchCounselorById } = jest.requireMock("@/lib/counselors");
const { callLLM } = jest.requireMock("@/lib/llm");
const { searchRagContext } = jest.requireMock("@/lib/rag");
const { hasServiceRole, getServiceSupabase } = jest.requireMock(
  "@/lib/supabase-server",
);

function createRequest(body: Record<string, unknown>) {
  return new NextRequest(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.DEMO_USER_ID = "demo-user";
  });

  it("creates a conversation, stores messages, and returns LLM output", async () => {
    hasServiceRole.mockReturnValue(true);

    const capturedMessages: unknown[] = [];
    const conversationInsert = jest.fn().mockReturnValue({
      select: () => ({ single: () => Promise.resolve({ data: { id: "conv-1" }, error: null }) }),
    });

    let messageInsertCount = 0;
    const messageInsert = jest.fn((rows: unknown) => {
      capturedMessages.push(rows);
      messageInsertCount += 1;
      if (messageInsertCount === 1) {
        return Promise.resolve({ data: null, error: null });
      }
      return {
        select: () => ({
          single: () => Promise.resolve({ data: { id: "msg-2" }, error: null }),
        }),
      };
    });

    const ragLogInsert = jest.fn().mockResolvedValue({});
    const userUpsert = jest.fn().mockResolvedValue({});

    getServiceSupabase.mockReturnValue({
      from: (table: string) => {
        switch (table) {
          case "users":
            return { upsert: userUpsert };
          case "conversations":
            return { insert: conversationInsert };
          case "messages":
            return { insert: messageInsert };
          case "rag_search_logs":
            return { insert: ragLogInsert };
          default:
            throw new Error(`Unexpected table ${table}`);
        }
      },
    });

    fetchCounselorById.mockResolvedValue({
      id: "michele",
      name: "ミシェル",
      systemPrompt: "system",
      ragEnabled: true,
      modelType: "openai",
      modelName: "gpt-4o-mini",
    });

    searchRagContext.mockResolvedValue({
      context: "参考",
      sources: [{ id: "chunk-1", chunk_text: "text", similarity: 0.9 }],
    });

    callLLM.mockResolvedValue({ content: "回答", tokensUsed: 33 });

    const response = await POST(
      createRequest({ message: "こんにちは", counselorId: "michele", useRag: true }),
    );

    const body = await response.json();

    expect(body).toMatchObject({
      conversationId: "conv-1",
      content: "回答",
      tokensUsed: 33,
    });
    expect(fetchCounselorById).toHaveBeenCalledWith("michele");
    expect(callLLM).toHaveBeenCalledWith(
      "openai",
      "gpt-4o-mini",
      "system",
      "こんにちは",
      "参考",
    );
    expect(capturedMessages).toHaveLength(2);
    expect(ragLogInsert).toHaveBeenCalled();
  });

  it("returns 400 when payload is invalid", async () => {
    const response = await POST(createRequest({}));
    expect(response.status).toBe(400);
  });
});
