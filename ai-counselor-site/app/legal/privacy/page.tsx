import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | メンタルAIチーム",
  description: "メンタルAIチームで取り扱う個人情報の方針をまとめたプライバシーポリシーです。",
};

const sections = [
  {
    title: "1. 収集する情報",
    body:
      "当協会は、本サービスの提供に必要な範囲で氏名、メールアドレス、決済情報、相談内容、アクセスログなどの個人情報を取得します。LINE連携等の外部サービス経由で取得する情報についても、利用目的の範囲内で管理します。",
  },
  {
    title: "2. 利用目的",
    body:
      "取得した情報は、本サービスの提供・本人確認・料金請求・お問い合わせ対応・品質改善・法令順守のために利用します。利用目的が変更される場合は、事前に通知または公表します。",
  },
  {
    title: "3. 第三者提供",
    body:
      "法令に基づく場合や業務委託先へ必要な範囲で提供する場合を除き、本人の同意なく第三者へ個人情報を提供しません。業務委託先とは秘密保持契約等を締結し、適切な管理を行います。",
  },
  {
    title: "4. クッキー等の利用",
    body:
      "当サイトでは利便性向上や統計分析のためにクッキーや同様の技術を使用することがあります。ブラウザ設定によりクッキーを拒否することも可能ですが、その場合一部の機能が利用できない可能性があります。",
  },
  {
    title: "5. 安全管理措置",
    body:
      "当協会は、個人情報への不正アクセス、紛失、破壊、改ざん及び漏洩等を防止するため、適切な技術的・組織的安全管理措置を講じます。従業者および委託先に対しては必要な監督を実施します。",
  },
  {
    title: "6. 開示・訂正・削除等の請求",
    body:
      "利用者ご本人から個人情報の開示、訂正、利用停止、削除等の申し出があった場合には、本人確認のうえ、合理的な範囲で速やかに対応します。",
  },
  {
    title: "7. 未成年者の情報",
    body:
      "未成年の利用者が本サービスを利用する場合は、保護者の同意を得た上で個人情報を提供してください。保護者の同意がないと判断した場合、利用を制限させていただくことがあります。",
  },
  {
    title: "8. ポリシーの改定",
    body:
      "本ポリシーは必要に応じて改定されることがあります。重要な変更がある場合は、当サイト上で告知するか、メール等でお知らせします。",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Legal</p>
          <h1 className="text-3xl font-bold text-slate-900">プライバシーポリシー</h1>
          <p className="text-sm text-slate-600">
            メンタルAIチーム（一般社団法人NAMIDAサポート協会）は、以下の方針に基づき個人情報を適切に取り扱います。
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">お問い合わせ窓口</p>
          <p className="mt-2">
            個人情報の取り扱いに関するご質問は、公式LINEまたはメール（
            <Link href="mailto:info@namisapo.com" className="underline decoration-slate-300 hover:decoration-slate-500">
              info@namisapo.com
            </Link>
            ）までご連絡ください。
          </p>
        </div>

        <div className="mt-8 text-sm text-slate-500">
          <p>2026年1月5日 制定</p>
          <p>一般社団法人NAMIDAサポート協会</p>
        </div>
      </div>
    </main>
  );
}
