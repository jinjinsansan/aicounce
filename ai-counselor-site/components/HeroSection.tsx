import Link from "next/link";

const heroHighlights = [
  { label: "専門カウンセラー", value: "8+" },
  { label: "平均応答", value: "1.8分" },
  { label: "相談満足度", value: "96%" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
      <div className="absolute inset-0 opacity-40" aria-hidden />
      <div className="relative z-10 space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Tape Psychology Platform
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            テープ式心理学と最新LLMを掛け合わせた
            <span className="text-cyan-200"> AIカウンセリング体験</span>
          </h1>
          <p className="max-w-2xl text-base text-cyan-50/90 sm:text-lg">
            8種の専門AIカウンセラーが、あなたの感情テープ・キャリア課題・学校や職場の
            ストレスまで伴走。RAGで蓄積した専門知をリアルタイムで呼び出します。
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            href="#counselors"
            className="inline-flex w-full items-center justify-center rounded-full bg-white/95 px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-white sm:w-auto"
          >
            カウンセラーを選ぶ
          </Link>
          <Link
            href="#features"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            仕組みを見る
          </Link>
        </div>

        <div className="flex flex-wrap gap-6 pt-4">
          {heroHighlights.map((item) => (
            <div key={item.label} className="min-w-[120px]">
              <p className="text-3xl font-bold">{item.value}</p>
              <p className="text-sm text-white/80">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
