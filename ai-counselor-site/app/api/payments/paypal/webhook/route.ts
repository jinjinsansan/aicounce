import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase-server";
import { assertPlanSlug, PLAN_DEFINITIONS, monthsFromNow } from "@/lib/plans";
import { getPayPalAccessToken } from "@/lib/paypal";

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

type PayPalCapture = {
  id?: string;
  custom_id?: string;
};

type PayPalPurchaseUnit = {
  custom_id?: string;
};

type PayPalWebhookPayload = {
  event_type?: string;
  resource?: {
    id?: string;
    purchase_units?: PayPalPurchaseUnit[];
    payments?: {
      captures?: PayPalCapture[];
    };
  };
};

export async function POST(request: Request) {
  const bodyText = await request.text();
  let payload: PayPalWebhookPayload;
  try {
    payload = JSON.parse(bodyText) as PayPalWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const headers = Object.fromEntries(request.headers.entries()) as Record<string, string>;
  if (!process.env.PAYPAL_WEBHOOK_ID) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  try {
    const token = await getPayPalAccessToken();
    const verifyResponse = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: headers["paypal-auth-algo"],
          cert_url: headers["paypal-cert-url"],
          transmission_id: headers["paypal-transmission-id"],
          transmission_sig: headers["paypal-transmission-sig"],
          transmission_time: headers["paypal-transmission-time"],
          webhook_id: process.env.PAYPAL_WEBHOOK_ID,
          webhook_event: payload,
        }),
      },
    );

    const verification = await verifyResponse.json();
    if (verification?.verification_status !== "SUCCESS") {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }

    if (payload?.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      await handleCapture(payload);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("paypal webhook error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleCapture(payload: PayPalWebhookPayload) {
  const adminSupabase = getServiceSupabase();
  const resource = payload.resource;
  if (!resource) return;
  const purchaseUnit = resource.purchase_units?.[0];
  const capture = resource.payments?.captures?.[0];
  const customId = capture?.custom_id ?? purchaseUnit?.custom_id;
  if (!customId) {
    return;
  }
  const [userId, plan] = String(customId).split(":");
  if (!userId || !assertPlanSlug(plan)) {
    return;
  }
  const planSlug = plan;

  await adminSupabase
    .from("user_subscriptions")
    .update({ status: "canceled" })
    .eq("user_id", userId)
    .neq("status", "canceled");

  await adminSupabase.from("user_subscriptions").insert({
    user_id: userId,
    plan_id: planSlug,
    status: "active",
    paypal_order_id: resource.id ?? capture?.id ?? null,
    current_period_end: monthsFromNow(1),
  });

  await adminSupabase.from("notifications").insert({
    user_id: userId,
    title: `${PLAN_DEFINITIONS[planSlug].label}の決済が完了しました`,
    body: `${PLAN_DEFINITIONS[planSlug].priceYen.toLocaleString()}円の決済を受領しました。ご利用ありがとうございます。`,
    channel: "inbox",
  });
}
