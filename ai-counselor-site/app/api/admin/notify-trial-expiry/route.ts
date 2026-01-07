import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase-server";
import { sendTrialExpiryNotificationEmail } from "@/lib/email/resend";

const ADMIN_EMAILS = new Set(["goldbenchan@gmail.com"]);

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminSupabase = getServiceSupabase();
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(now.getDate() + 3);

    const { data: trials, error } = await adminSupabase
      .from("user_trials")
      .select("user_id, trial_expires_at, users(email)")
      .gte("trial_expires_at", now.toISOString())
      .lte("trial_expires_at", threeDaysLater.toISOString())
      .not("trial_expires_at", "is", null);

    if (error) throw error;

    const notifications: Array<{ success: boolean; email?: string; error?: unknown }> = [];

    for (const trial of trials ?? []) {
      const userEmail = (trial.users as { email?: string } | null)?.email;
      if (!userEmail || !trial.trial_expires_at) continue;

      try {
        await sendTrialExpiryNotificationEmail(userEmail, trial.trial_expires_at);
        notifications.push({ success: true, email: userEmail });
      } catch (emailError) {
        console.error(`Failed to send trial expiry notification to ${userEmail}`, emailError);
        notifications.push({ success: false, email: userEmail, error: emailError });
      }
    }

    return NextResponse.json({
      success: true,
      sent: notifications.filter((n) => n.success).length,
      failed: notifications.filter((n) => !n.success).length,
      total: notifications.length,
    });
  } catch (error) {
    console.error("notify-trial-expiry error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
