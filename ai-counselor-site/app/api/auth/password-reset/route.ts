import { NextResponse } from "next/server";

import { getServiceSupabase } from "@/lib/supabase-server";
import { sendPasswordResetEmail } from "@/lib/email/resend";

function resolveBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  return (siteUrl ?? "https://mentalai.team").replace(/\/$/, "");
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (typeof email !== "string") {
      return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const redirectTo = `${resolveBaseUrl()}/login`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: { redirectTo },
    });

    if (error) {
      console.error("generate recovery link failed", error);
      return NextResponse.json({ error: "再設定リンクの生成に失敗しました" }, { status: 500 });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json({ error: "再設定リンクの生成に失敗しました" }, { status: 500 });
    }

    await sendPasswordResetEmail(normalizedEmail, actionLink);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("password reset email error", error);
    return NextResponse.json({ error: "パスワード再設定メールの送信に失敗しました" }, { status: 500 });
  }
}
