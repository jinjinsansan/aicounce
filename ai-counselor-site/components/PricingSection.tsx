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
                  {plan.name === "フリー" ? (
                    <Link
                      href={plan.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[#06C755] py-4 font-bold text-white shadow-xl shadow-green-500/30 transition-all hover:bg-[#05b34c] hover:shadow-2xl hover:shadow-green-500/40 hover:-translate-y-1 active:translate-y-0"
                    >
                      <svg
                        className="h-5 w-5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                      <span className="relative">
                        {plan.cta}
                      </span>
                      <span className="absolute right-4 opacity-0 transition-all group-hover/btn:opacity-100 group-hover/btn:right-3">
                        →
                      </span>
                    </Link>
                  ) : (
                    <Link
                      href={plan.ctaLink}
                      className={`flex w-full items-center justify-center rounded-full py-3.5 font-bold transition-all ${
                        plan.highlight
                          ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5"
                          : "bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:shadow-xl hover:-translate-y-0.5"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}

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

