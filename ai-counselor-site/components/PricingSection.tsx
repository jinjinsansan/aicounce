import Link from "next/link";

export default function PricingSection() {
  const plans = [
    {
      name: "フリー",
      price: "¥0",
      period: "7日間",
      description: "まずは無料で体験",
      features: [
        "公式LINE追加で即開始",
        "7日間すべての機能利用可",
        "全AIカウンセラーお試し可",
        "クレカ登録不要",
      ],
      cta: "公式LINEで無料体験",
      ctaLink: "https://line.me/",
      highlight: false,
      gradient: "from-slate-50 to-slate-100",
      badge: "",
    },
    {
      name: "ベーシック",
      price: "¥1,980",
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
      gradient: "from-orange-50 via-amber-50 to-yellow-50",
      badge: "人気No.1",
    },
    {
      name: "プレミアム",
      price: "¥2,980",
      period: "/月",
      description: "より深い対話を求める方へ",
      features: [
        "ベーシックプランの全機能",
        "マルチカウンセリングチャット",
        "複数AIの同時相談・比較",
        "専門家の多角的な視点",
        "より深い洞察と気づき",
        "優先サポート対応",
      ],
      cta: "プレミアムを試す",
      ctaLink: "#counselors",
      highlight: false,
      gradient: "from-purple-50 via-pink-50 to-rose-50",
      badge: "",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-24">
      <div className="container mx-auto px-2 sm:px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold tracking-wider text-emerald-700">
            PRICING
          </span>
          <h2 className="mb-6 text-3xl font-bold text-slate-900 md:text-4xl">
            シンプルで、続けやすい価格
          </h2>
          <p className="mb-12 text-lg text-slate-600">
            心のケアは、贅沢品ではありません。
            <br className="hidden sm:inline" />
            誰でも日常的に利用できるインフラを目指しました。
          </p>

          {/* Pricing Cards Grid */}
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`group relative overflow-hidden rounded-2xl transition-all duration-300 sm:rounded-3xl ${
                  plan.highlight
                    ? "scale-100 border-2 border-orange-200 shadow-2xl shadow-orange-100/50 sm:scale-105"
                    : "border border-slate-200 shadow-sm hover:shadow-xl"
                } bg-gradient-to-br ${plan.gradient}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute right-0 top-0 rounded-bl-3xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2 text-xs font-bold text-white shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <div className="relative p-6 sm:p-8">
                  {/* Plan Header */}
                  <div className="mb-6 text-center">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                      {plan.name}
                    </h3>
                    <div className="mb-3 flex items-baseline justify-center gap-1">
                      <span
                        className={`font-shippori text-5xl font-black tracking-tight ${
                          plan.highlight ? "text-orange-600" : "text-slate-900"
                        }`}
                      >
                        {plan.price}
                      </span>
                      <span className="text-lg font-medium text-slate-500">{plan.period}</span>
                    </div>
                    <p className="text-sm text-slate-600">{plan.description}</p>
                  </div>

                  {/* Features List */}
                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            plan.highlight
                              ? "bg-orange-200 text-orange-600"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link
                    href={plan.ctaLink}
                    target={plan.name === "フリー" ? "_blank" : undefined}
                    rel={plan.name === "フリー" ? "noopener noreferrer" : undefined}
                    className={`flex w-full items-center justify-center rounded-full py-3.5 font-bold transition-all ${
                      plan.highlight
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5"
                        : plan.name === "フリー"
                          ? "bg-[#06C755] text-white shadow-lg shadow-green-500/20 hover:bg-[#05b34c] hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5"
                          : "bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5"
                    }`}
                  >
                    {plan.name === "フリー" && <span className="mr-2">💬</span>}
                    {plan.cta}
                  </Link>

                  {/* Free Plan Note */}
                  {plan.name === "フリー" && (
                    <p className="mt-4 text-center text-xs text-slate-500">
                      無料期間終了後も自動課金なし
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

