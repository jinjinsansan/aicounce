import Link from "next/link";

export default function PricingSection() {
  const betaPerk = {
    badge: "BETA SPECIAL",
    title: "公式LINE連携でベータ期間ずっと無料",
    description:
      "今だけ、LINE公式アカウントを追加するだけで個別・チームを含むすべてのAIカウンセリングが無期限で解放されます。クレジットカード登録は不要、解除もワンタップです。",
    highlights: [
      "即日アクティベーションで待ち時間ゼロ",
      "ベーシック/プレミアム相当の機能がすべて開放",
      "ベータ終了前には必ず事前告知",
    ],
    cta: {
      label: "LINEで無料アクセスを取得",
      href: "https://line.me/R/ti/p/@701wsyqr",
    },
  };

  const plans = [
    {
      name: "フリー",
      price: "¥0",
      period: "β期間中ずっと",
      description: "公式LINE連携だけで全機能を解放",
      features: [
        "公式LINE追加で即開始",
        "個別・チーム含む全AIが無制限",
        "24時間いつでも相談・再開",
        "クレカ登録なし / いつでも解除",
      ],
      cta: "LINEで今すぐ無料参加",
      ctaLink: "https://line.me/R/ti/p/@701wsyqr",
      highlight: false,
    },
    {
      name: "ベーシック",
      price: "¥500",
      period: "/月",
      description: "毎日使える安心プラン",
      features: [
        "各種AIカウンセラー使い放題",
        "24時間365日いつでも相談",
        "チャット履歴無期限保存",
        "RAG専門知識ベース回答",
        "新機能の優先利用",
        "広告なし・完全プライベート",
      ],
      cta: "今すぐ始める",
      ctaLink: "#counselors",
      highlight: true,
    },
    {
      name: "プレミアム",
      price: "¥1,500",
      period: "/月",
      description: "より深い対話を求める方へ",
      features: [
        "ベーシックプランの全機能",
        "チームカウンセリングチャット",
        "複数AIの同時相談・比較",
        "専門家の多角的な視点",
        "より深い洞察と気づき",
        "優先サポート対応",
      ],
      cta: "プレミアムを試す",
      ctaLink: "#counselors",
      highlight: false,
    },
  ];

  return (
    <section className="bg-white py-20" id="pricing">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
            PRICING
          </span>
          <h2 className="mb-4 text-3xl font-black text-slate-900 md:text-4xl">
            シンプルで、続けやすい価格
          </h2>
          <p className="mb-12 text-lg text-slate-600">
            心のケアを当たり前のインフラに。必要なときに、無理なく続けられるプランです。
          </p>

          <div className="mb-12 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 text-left shadow-[0_15px_45px_rgba(16,185,129,0.15)] sm:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {betaPerk.badge}
            </div>
            <h3 className="text-2xl font-black text-slate-900 sm:text-3xl">{betaPerk.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{betaPerk.description}</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {betaPerk.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 rounded-2xl bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href={betaPerk.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
            >
              {betaPerk.cta.label}
            </Link>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 sm:rounded-3xl ${
                  plan.highlight
                    ? "border-slate-900 bg-slate-900 text-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
                    : "border-slate-200 bg-white shadow-sm hover:shadow-lg"
                }`}
              >
                <div className={`relative p-6 sm:p-8 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  <div className="mb-6 text-center">
                    <h3 className={`mb-2 text-sm font-bold uppercase tracking-wider ${plan.highlight ? "text-white/70" : "text-slate-500"}`}>
                      {plan.name}
                    </h3>
                    <div className="mb-3 flex items-baseline justify-center gap-1">
                      <span className={`text-5xl font-black tracking-tight ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                        {plan.price}
                      </span>
                      <span className={`text-lg font-medium ${plan.highlight ? "text-white/70" : "text-slate-500"}`}>{plan.period}</span>
                    </div>
                    <p className={`text-sm ${plan.highlight ? "text-white/80" : "text-slate-600"}`}>{plan.description}</p>
                  </div>

                  {/* Features List */}
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <div className={`mt-1 h-1.5 w-1.5 rounded-full ${plan.highlight ? "bg-white/80" : "bg-slate-400"}`} />
                        <span className={`text-sm ${plan.highlight ? "text-white" : "text-slate-700"}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {plan.name === "フリー" ? (
                    <Link
                      href={plan.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-slate-300 px-6 py-4 text-base font-bold text-slate-900 transition-all hover:bg-slate-100"
                    >
                      <span className="relative text-base">{plan.cta}</span>
                      <span className="absolute right-6 text-lg transition-all group-hover/btn:translate-x-1">→</span>
                    </Link>
                  ) : (
                    <Link
                      href={plan.ctaLink}
                      className={`flex w-full items-center justify-center rounded-full py-3.5 font-bold transition-all ${
                        plan.highlight
                          ? "bg-white text-slate-900"
                          : "bg-slate-900 text-white hover:bg-black"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}

                  {/* Free Plan Note */}
                  {plan.name === "フリー" && (
                    <p className="mt-4 text-center text-xs text-slate-500">
                      ベータ終了前に必ずご案内し、それまでは課金されません
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

