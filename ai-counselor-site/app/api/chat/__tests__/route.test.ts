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

jest.mock("@/lib/supabase-clients", () => ({
  createSupabaseRouteClient: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: () => [],
  })),
}));

const { fetchCounselorById } = jest.requireMock("@/lib/counselors");
const { callLLM } = jest.requireMock("@/lib/llm");
const { searchRagContext } = jest.requireMock("@/lib/rag");
const { hasServiceRole, getServiceSupabase } = jest.requireMock(
  "@/lib/supabase-server",
);
const { createSupabaseRouteClient } = jest.requireMock(
  "@/lib/supabase-clients",
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

function setupAuthedSupabase(conversationId = "conv-1") {
  const capturedMessages: unknown[] = [];
  const client = {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: "user-1",
              email: "user@example.com",
              user_metadata: { full_name: "User" },
            },
          },
        },
      }),
    },
    from: jest.fn((table: string) => {
      if (table === "conversations") {
        return {
          insert: jest.fn().mockReturnValue({
            select: () => ({
              single: () =>
                Promise.resolve({ data: { id: conversationId }, error: null }),
            }),
          }),
          select: jest.fn().mockReturnValue({
            single: () =>
              Promise.resolve({ data: { id: conversationId }, error: null }),
          }),
        };
      }
      if (table === "messages") {
        return {
          insert: jest.fn((payload: unknown) => {
            capturedMessages.push(payload);
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: `msg-${capturedMessages.length}` },
                    error: null,
                  }),
              }),
            };
          }),
        };
      }
      return {
        insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        select: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };

  createSupabaseRouteClient.mockReturnValue(client);
  return { capturedMessages, client };
}

function setupSessionlessSupabase() {
  const client = {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: null,
        },
      }),
    },
    from: jest.fn(),
  };
  createSupabaseRouteClient.mockReturnValue(client);
  return client;
}

function setupAdminSupabase() {
  const ragLogInsert = jest.fn().mockResolvedValue({});
  const userUpsert = jest.fn().mockResolvedValue({});
  getServiceSupabase.mockReturnValue({
    from: (table: string) => {
      switch (table) {
        case "users":
          return { upsert: userUpsert };
        case "rag_search_logs":
          return { insert: ragLogInsert };
        default:
          throw new Error(`Unexpected table ${table}`);
      }
    },
  });
  return { ragLogInsert, userUpsert };
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("creates a conversation, stores messages, and returns LLM output", async () => {
    hasServiceRole.mockReturnValue(true);
    const { capturedMessages } = setupAuthedSupabase();
    const { ragLogInsert } = setupAdminSupabase();

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

  it("returns 401 when no session is present", async () => {
    hasServiceRole.mockReturnValue(false);
    setupSessionlessSupabase();

    fetchCounselorById.mockResolvedValue({
      id: "michele",
      name: "ミシェル",
      systemPrompt: "system",
      ragEnabled: false,
      modelType: "openai",
      modelName: "gpt-4o-mini",
    });

    const response = await POST(
      createRequest({ message: "こんにちは", counselorId: "michele" }),
    );

    expect(response.status).toBe(401);
    expect(searchRagContext).not.toHaveBeenCalled();
  });

  it("skips RAG lookup when counselor is not RAG enabled", async () => {
    hasServiceRole.mockReturnValue(false);
    setupAuthedSupabase();

    fetchCounselorById.mockResolvedValue({
      id: "gpt",
      name: "GPT",
      systemPrompt: "system",
      ragEnabled: false,
      modelType: "openai",
      modelName: "gpt-4o-mini",
    });

    callLLM.mockResolvedValue({ content: "回答", tokensUsed: 10 });

    const response = await POST(
      createRequest({ message: "hi", counselorId: "gpt", useRag: true }),
    );

    const body = await response.json();
    expect(body.content).toBe("回答");
    expect(searchRagContext).not.toHaveBeenCalled();
  });
});
