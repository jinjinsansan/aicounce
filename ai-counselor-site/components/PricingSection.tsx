import Link from "next/link";

export default function PricingSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold tracking-wider mb-4">
            PRICING
          </span>
          <h2 className="mb-6 text-3xl font-bold text-slate-900 md:text-4xl">
            シンプルで、続けやすい価格
          </h2>
          <p className="mb-12 text-slate-600 text-lg">
            心のケアは、贅沢品ではありません。<br className="hidden sm:inline"/>
            誰でも日常的に利用できるインフラを目指しました。
          </p>

          <div className="relative overflow-hidden rounded-[48px] bg-white shadow-2xl ring-1 ring-slate-100 transform transition-all hover:scale-[1.02]">
            <div className="absolute top-0 right-0 rounded-bl-[40px] bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-lg">
              おすすめ / Most Popular
            </div>
            
            <div className="p-10 md:p-16">
              <h3 className="mb-2 text-xl font-bold text-slate-500">
                使い放題プラン
              </h3>
              <div className="my-8 flex items-baseline justify-center gap-2">
                <span className="text-6xl font-black text-slate-900 tracking-tight">¥1,500</span>
                <span className="text-xl font-medium text-slate-500">/月</span>
              </div>
              
              <div className="mb-10 grid gap-4 text-left sm:grid-cols-2">
                {[
                  "24時間いつでも相談可能",
                  "8種以上の専門AIカウンセラー",
                  "チャット履歴の無期限保存",
                  "RAG専門知識ベース回答",
                  "新機能の先行利用",
                  "広告なし・完全プライベート"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 list-none">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-700 font-medium">{feature}</span>
                  </li>
                ))}
              </div>

              <div className="space-y-6 bg-slate-50 p-8 rounded-3xl">
                <div className="text-center">
                  <span className="inline-block animate-bounce text-2xl mb-2">🎁</span>
                  <p className="font-bold text-slate-800 mb-1">まずは無料で体験してください</p>
                  <p className="text-sm text-slate-500">
                    公式LINEを追加すると <span className="text-blue-600 font-bold text-lg">7日間無料</span> でお試しいただけます
                  </p>
                </div>
                
                <Link 
                  href="https://line.me/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-full bg-[#06C755] py-5 text-xl font-bold text-white shadow-xl shadow-green-500/20 transition-all hover:bg-[#05b34c] hover:shadow-2xl hover:shadow-green-500/30 hover:-translate-y-1 active:translate-y-0"
                >
                  <span className="mr-2 text-2xl">💬</span>
                  公式LINEで無料体験を始める
                </Link>
                <p className="text-xs text-slate-400">
                  ※無料期間終了後も、自動で課金されることは一切ありません。<br/>
                  クレジットカード登録も不要です。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

