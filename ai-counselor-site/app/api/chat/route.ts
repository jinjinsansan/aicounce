import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, counselorId, conversationId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      );
    }

    const baseResponse =
      "これはデモ応答です。Phase 3でLLM接続を実装すると、ここで実際のカウンセラー回答が生成されます。";

    return NextResponse.json({
      conversationId: conversationId ?? "demo",
      counselorId,
      content: `${baseResponse}\n\nユーザー入力: ${message}`,
      tokensUsed: 0,
    });
  } catch (error) {
    console.error("Chat API error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
