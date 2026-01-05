import { NextResponse } from "next/server";
import { WebhookEvent, validateSignature } from "@line/bot-sdk";
import { lineClient, lineConfig } from "@/lib/line-client";

const channelSecret = lineConfig.channelSecret;

export async function POST(request: Request) {
  if (!channelSecret || !lineConfig.channelAccessToken) {
    console.error("LINE credentials are not set");
    return NextResponse.json({ error: "LINE credentials not configured" }, { status: 500 });
  }

  const bodyText = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";

  const isValid = validateSignature(bodyText, channelSecret, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let events: WebhookEvent[] = [];
  try {
    const parsed = JSON.parse(bodyText) as { events?: WebhookEvent[] };
    events = parsed.events ?? [];
  } catch (error) {
    console.error("Failed to parse LINE webhook payload", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await Promise.all(events.map(handleEvent));

  return NextResponse.json({ success: true });
}

async function handleEvent(event: WebhookEvent) {
  if (event.type === "follow") {
    await sendTrialMessage(event.replyToken);
    return;
  }

  if (event.type === "message" && event.message.type === "text") {
    await sendTrialMessage(event.replyToken);
  }
}

async function sendTrialMessage(replyToken?: string) {
  if (!replyToken) return;

  try {
    await lineClient.replyMessage(replyToken, [
      {
        type: "text",
        text: "LINE連携が完了しました。本日より7日間、個別・チームを含むすべてのAIカウンセリングがご利用いただけます。メンタルAIチームのサイトで『連携を確認する』ボタンを押すとトライアルが即時反映されます。",
      },
    ]);
  } catch (error) {
    console.error("Failed to send LINE reply", error);
  }
}
