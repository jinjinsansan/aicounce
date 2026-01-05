import { NextResponse } from "next/server";

import { getServiceSupabase } from "@/lib/supabase-server";
import { sendNewsletterWelcomeEmail } from "@/lib/email/resend";

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
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email: normalizedEmail,
          confirmed_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      )
      .select("id")
      .single();

    if (error) {
      console.error("newsletter subscribe error", error);
      return NextResponse.json({ error: "登録処理に失敗しました" }, { status: 500 });
    }

    if (data) {
      await sendNewsletterWelcomeEmail(normalizedEmail);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("newsletter subscribe handler error", error);
    return NextResponse.json({ error: "登録処理に失敗しました" }, { status: 500 });
  }
}
