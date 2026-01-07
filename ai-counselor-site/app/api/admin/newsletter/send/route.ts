import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createSupabaseRouteClient } from "@/lib/supabase-clients";
import { getServiceSupabase } from "@/lib/supabase-server";
import { sendNewsletterBroadcast } from "@/lib/email/resend";

const ADMIN_EMAILS = new Set(["goldbenchan@gmail.com"]);

const bodySchema = z.object({
  subject: z.string().min(1).max(200),
  htmlContent: z.string().min(10),
  recipientType: z.enum(["all", "custom"]),
  customEmails: z.array(z.string().email()).optional(),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createSupabaseRouteClient(cookieStore);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userEmail = session.user.email?.toLowerCase();
  if (!userEmail || !ADMIN_EMAILS.has(userEmail)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { subject, htmlContent, recipientType, customEmails } = bodySchema.parse(await request.json());
    const adminSupabase = getServiceSupabase();

    let recipients: string[] = [];

    if (recipientType === "all") {
      const { data: subscribers, error } = await adminSupabase
        .from("newsletter_subscribers")
        .select("email")
        .not("confirmed_at", "is", null);

      if (error) throw error;
      recipients = subscribers?.map((s) => s.email) ?? [];
    } else if (recipientType === "custom" && customEmails) {
      recipients = customEmails;
    } else {
      return NextResponse.json({ error: "Invalid recipient configuration" }, { status: 400 });
    }

    if (recipients.length === 0) {
      return NextResponse.json({ error: "No recipients found" }, { status: 400 });
    }

    const { succeeded, failed, total } = await sendNewsletterBroadcast(recipients, subject, htmlContent);

    const { data: broadcast } = (await adminSupabase
      .from("newsletter_broadcasts")
      .insert({
        subject,
        html_content: htmlContent,
        sent_by: session.user.id,
        recipient_count: total,
        success_count: succeeded,
        failed_count: failed,
        sent_at: new Date().toISOString(),
      } as never)
      .select("id")
      .single()) as { data: { id: string } | null };

    return NextResponse.json({
      success: true,
      broadcastId: broadcast?.id,
      sent: succeeded,
      failed,
      total,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    console.error("newsletter send error", error);
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 });
  }
}
