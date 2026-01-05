import { NextResponse } from "next/server";

import { getServiceSupabase } from "@/lib/supabase-server";
import { sendSignupEmail } from "@/lib/email/resend";

function resolveBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL;
  return (siteUrl ?? "https://mentalai.team").replace(/\/$/, "");
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "パスワードは8文字以上にしてください" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const redirectTo = `${resolveBaseUrl()}/login`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      password,
      options: { redirectTo },
    });

    if (error) {
      console.error("generate signup link failed", error);
      return NextResponse.json({ error: "サインアップリンクの生成に失敗しました" }, { status: 500 });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json({ error: "サインアップリンクの生成に失敗しました" }, { status: 500 });
    }

    await sendSignupEmail(normalizedEmail, actionLink);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("signup email error", error);
    return NextResponse.json({ error: "サインアップメールの送信に失敗しました" }, { status: 500 });
  }
}
