import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | メンタルAIチーム",
  description: "メンタルAIチーム（一般社団法人NAMIDAサポート協会）が提供するサービスの特定商取引法に基づく表記です。",
};

const entries: { label: string; value: ReactNode }[] = [
  { label: "販売業者名", value: "一般社団法人NAMIDAサポート協会" },
  { label: "住所", value: "東京都港区南青山1-20-12" },
  { label: "電話番号", value: "電話でのお問い合わせは不可" },
  {
    label: "メールアドレス",
    value: (
      <Link href="mailto:info@namisapo.com" className="text-slate-900 underline decoration-slate-300 hover:decoration-slate-500">
        info@namisapo.com
      </Link>
    ),
  },
  {
    label: "販売URL",
    value: (
      <Link href="https://www.mentalai.team/" className="text-slate-900 underline decoration-slate-300 hover:decoration-slate-500">
        https://www.mentalai.team/
      </Link>
    ),
  },
  { label: "お支払方法", value: "クレジットカード、銀行振込" },
  { label: "販売価格", value: "ベーシックプラン 月額1,980円 / プレミアムプラン 月額3,980円" },
  { label: "支払い回数", value: "毎月" },
  { label: "支払い開始時", value: "お申し込み時" },
  { label: "商品代金以外の費用", value: "振込手数料、クレジットカード会社の手数料" },
  { label: "商品の内容", value: "AIカウンセリングチャット（メンタルAIチーム）" },
  {
    label: "商品の引き渡し場所",
    value: (
      <Link href="https://www.mentalai.team/" className="text-slate-900 underline decoration-slate-300 hover:decoration-slate-500">
        https://www.mentalai.team/
      </Link>
    ),
  },
  { label: "商品に関するお問い合わせ", value: "公式LINEまたはメールにて承ります" },
  { label: "商品名", value: "メンタルAIチーム" },
  { label: "返品について", value: "デジタル商品のため返品不可" },
];

export default function TokushoPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Legal</p>
          <h1 className="text-3xl font-bold text-slate-900">特定商取引法に基づく表記</h1>
          <p className="text-sm text-slate-600">
            メンタルAIチームを運営する一般社団法人NAMIDAサポート協会の法定表記は以下の通りです。
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <dl className="divide-y divide-slate-100">
            {entries.map((item) => (
              <div key={item.label} className="grid gap-4 px-6 py-5 sm:grid-cols-3 sm:items-center">
                <dt className="text-sm font-semibold text-slate-700">{item.label}</dt>
                <dd className="sm:col-span-2 text-sm text-slate-600 leading-relaxed">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-10 space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">お問い合わせ</h2>
          <p className="text-sm text-slate-600">
            サービスに関するご不明点がございましたら、公式LINEもしくはメール（
            <Link href="mailto:info@namisapo.com" className="underline decoration-slate-300 hover:decoration-slate-500">
              info@namisapo.com
            </Link>
            ）までご連絡ください。
          </p>
        </div>
      </div>
    </main>
  );
}
