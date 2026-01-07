import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

import { getDiaryEntry } from "@/lib/diary";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

const clamp = (text: string, limit: number) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit)}…` : normalized;
};

export async function GET(_request: Request, context: { params: { entryId: string } } | { params: Promise<{ entryId: string }> }) {
  try {
    const resolvedParams = await Promise.resolve((context as any).params);
    const entryId = (resolvedParams as { entryId: string }).entryId;
    const entry = await getDiaryEntry(entryId);
    if (!entry || entry.is_shareable === false) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const title = entry.title ?? `${entry.author_name}の朝のひとこと`;
    const content = clamp(entry.content ?? "", 240);
    const dateLabel = entry.journal_date ?? entry.published_at;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
            fontFamily: "'Noto Sans JP', 'Inter', sans-serif",
            color: "#0f172a",
          }}
        >
          <div
            style={{
              margin: 48,
              padding: 48,
              borderRadius: 32,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 60px rgba(15,23,42,0.08)",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {entry.author_name.slice(0, 2)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{entry.author_name}</div>
                <div style={{ fontSize: 16, color: "#475569" }}>{dateLabel}</div>
              </div>
            </div>

            <div style={{ fontSize: 34, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>
              {clamp(title, 36)}
            </div>

            <div
              style={{
                padding: 28,
                borderRadius: 24,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: 26,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                color: "#0f172a",
                flex: 1,
              }}
            >
              {content}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, color: "#475569" }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>AIカウンセラーの日記</div>
              <div style={{ fontSize: 18 }}>mentalai.team</div>
            </div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
      },
    );
  } catch (error) {
    console.error("Failed to generate diary og image", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
