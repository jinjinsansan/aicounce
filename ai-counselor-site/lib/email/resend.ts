import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@mentalai.team";

let resendClient: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

type EmailLayoutOptions = {
  title: string;
  body: string;
  actionLabel?: string;
  actionUrl?: string;
  footer?: string;
};

function buildEmailLayout({ title, body, actionLabel, actionUrl, footer }: EmailLayoutOptions) {
  const button =
    actionLabel && actionUrl
      ? `<a href="${actionUrl}" style="display:inline-block;padding:12px 20px;background-color:#111827;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:600;margin-top:24px">${actionLabel}</a>`
      : "";

  return `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f9fafb;padding:32px;color:#111827">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e5e7eb;">
      <p style="font-size:12px;letter-spacing:0.15em;color:#6366f1;font-weight:700;margin:0 0 12px;">MENTAL AI TEAM</p>
      <h1 style="font-size:24px;margin:0 0 16px;line-height:1.4;">${title}</h1>
      <p style="font-size:15px;line-height:1.8;color:#4b5563;margin:0;white-space:pre-line;">${body}</p>
      ${button}
      <p style="font-size:12px;color:#9ca3af;margin-top:32px;line-height:1.6;">
        ${
          footer ??
          "このメールに心当たりがない場合は破棄してください。"
        }
      </p>
    </div>
    <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:16px;">© ${new Date().getFullYear()} Mental AI Team</p>
  </div>`;
}

export async function sendSignupEmail(to: string, actionLink: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "【Mental AI Team】メールアドレスの確認",
    html: buildEmailLayout({
      title: "ご登録ありがとうございます",
      body: "以下のボタンからメールアドレスを確認し、登録を完了してください。\nリンクは一定時間で無効になります。",
      actionLabel: "メールアドレスを確認",
      actionUrl: actionLink,
    }),
  });
}

export async function sendPasswordResetEmail(to: string, actionLink: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "【Mental AI Team】パスワード再設定",
    html: buildEmailLayout({
      title: "パスワード再設定のご案内",
      body: "以下のボタンからパスワードの再設定を行ってください。\n心当たりがない場合はこのメールを破棄してください。",
      actionLabel: "パスワードを再設定",
      actionUrl: actionLink,
    }),
  });
}

export async function sendNewsletterWelcomeEmail(to: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "【Mental AI Team】ニュースレター登録ありがとうございます",
    html: buildEmailLayout({
      title: "ニュースレター登録が完了しました",
      body: "心のケアに役立つ最新情報を定期的にお届けします。\nご不要になった際はいつでも配信停止いただけます。",
    }),
  });
}
