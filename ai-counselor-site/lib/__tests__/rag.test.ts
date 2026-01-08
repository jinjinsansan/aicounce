/** @jest-environment node */

import { searchRagContext } from "../rag";

jest.mock("@/lib/supabase", () => ({
  getSupabaseClient: jest.fn(),
  hasSupabaseConfig: jest.fn(),
}));

jest.mock("@/lib/supabase-server", () => ({
  hasServiceRole: jest.fn(),
  getServiceSupabase: jest.fn(),
}));

const { getSupabaseClient, hasSupabaseConfig } = jest.requireMock("@/lib/supabase");
const { hasServiceRole } = jest.requireMock("@/lib/supabase-server");

describe("searchRagContext", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.OPENAI_API_KEY = "test";
    global.fetch = jest.fn();
    hasServiceRole.mockReturnValue(false);
  });

  it("returns formatted context when matches are found", async () => {
    hasSupabaseConfig.mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: [0.1, 0.2] }] }),
    });

    const rpc = jest.fn().mockResolvedValue({
      data: [
        {
          id: "chunk-1",
          document_id: "doc-1",
          parent_chunk_id: null,
          chunk_text: "テストチャンク",
          similarity: 0.92,
        },
      ],
      error: null,
    });
    getSupabaseClient.mockReturnValue({ rpc });

    const result = await searchRagContext("counselor-1", "質問", 1);

    expect(result.sources).toHaveLength(1);
    expect(result.context).toContain("[ソース 1]");
    expect(result.context).toContain("テストチャンク");
    expect(rpc.mock.calls[0][0]).toBe("match_rag_chunks_sinr");
  });

  it("returns empty context when Supabase config is missing", async () => {
    hasSupabaseConfig.mockReturnValue(false);

    const result = await searchRagContext("counselor-1", "質問", 1);

    expect(result).toEqual({ context: "", sources: [] });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("handles embedding API failures gracefully", async () => {
    hasSupabaseConfig.mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: async () => "error",
    });

    const result = await searchRagContext("counselor-1", "質問", 1);

    expect(result).toEqual({ context: "", sources: [] });
  });
});
