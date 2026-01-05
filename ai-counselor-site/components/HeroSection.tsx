import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> 24時間365日 即応
        </div>

        <div className="space-y-5">
          <h1 className="text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            もう、誰にも気を使わなくていい。
          </h1>
          <p className="text-lg leading-relaxed text-slate-600">
            人間が一切介在しない、AIだけのカウンセリングチーム。もう、誰にも気を使わなくていい。様々なプロフェッショナルAIカウンセラーがあなたの心の声を優しく聴きます。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["批判も評価もしない完全匿名の対話","待ち時間0秒、いつでも即レス","月額1,980円で10人の専門AIが伴走"].map((text) => (
            <div key={text} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-700">
              {text}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="#counselors"
            className="flex items-center justify-center rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-black"
          >
            カウンセラーを選ぶ
          </Link>
          <Link
            href="#about"
            className="flex items-center justify-center rounded-full border border-slate-300 px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            サービスについて
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:grid-cols-3">
          {[{ label: "専門AI", value: "10名" }, { label: "待ち時間", value: "0秒" }, { label: "月額", value: "¥1,980" }].map((item) => (
            <div key={item.label} className="space-y-1 text-center">
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
