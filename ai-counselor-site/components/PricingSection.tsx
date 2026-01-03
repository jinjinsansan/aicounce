import Link from "next/link";

export default function PricingSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900">
            シンプルな料金体系
          </h2>
          <p className="mb-12 text-slate-600">
            心のケアを、誰でも日常的に利用できる価格で。
          </p>

          <div className="relative overflow-hidden rounded-[40px] bg-white shadow-xl ring-1 ring-slate-200">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-emerald-500" />
            <div className="p-10 md:p-14">
              <h3 className="mb-2 text-xl font-bold text-slate-500">
                使い放題プラン
              </h3>
              <div className="my-6 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-slate-900">¥1,500</span>
                <span className="text-lg text-slate-500">/月</span>
              </div>
              
              <ul className="mb-10 space-y-4 text-left">
                {[
                  "24時間いつでも相談可能",
                  "8種以上の専門AIカウンセラー指名し放題",
                  "チャット履歴の無期限保存",
                  "RAGによる専門知識ベースの回答",
                  "新機能・新カウンセラーの先行利用"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                      ✓
                    </div>
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-4">
                <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                  <span className="font-bold">🎉 初回特典</span>
                  <br />
                  公式LINEを追加すると <span className="text-lg font-bold">7日間無料</span> でお試しいただけます
                </div>
                
                <Link 
                  href="https://line.me/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-full bg-[#06C755] py-4 text-lg font-bold text-white shadow-lg transition hover:bg-[#05b34c] hover:shadow-xl active:translate-y-0.5"
                >
                  公式LINEで今すぐ無料体験
                </Link>
                <p className="text-xs text-slate-400 mt-2">
                  ※無料期間終了後も自動で課金されることはありません
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
