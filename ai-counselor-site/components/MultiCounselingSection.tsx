import Image from "next/image";
import { MessageCircle, Users, Sparkles } from "lucide-react";

export default function MultiCounselingSection() {
  const counselorIcons = [
    { name: "Michelle", image: "/images/counselors/michelle.png", color: "from-pink-400 to-rose-400" },
    { name: "Dr. Sato", image: "/images/counselors/dr_satou.png", color: "from-blue-400 to-cyan-400" },
    { name: "Alex", image: "/images/counselors/alex.png", color: "from-green-400 to-emerald-400" },
    { name: "Nana", image: "/images/counselors/nana.png", color: "from-purple-400 to-pink-400" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-16 sm:py-24">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[5%] top-[10%] h-96 w-96 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute bottom-[10%] right-[5%] h-80 w-80 rounded-full bg-pink-200/30 blur-3xl" />
      </div>

      <div className="container mx-auto px-2 sm:px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="mb-12 text-center sm:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-1.5 text-xs font-bold tracking-wider text-white shadow-lg">
              <Sparkles size={14} />
              PREMIUM FEATURE
            </div>
            <h2 className="font-shippori mb-6 text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">
              マルチカウンセリング
              <br />
              チャット機能搭載
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              複数のAIカウンセラーが同時に、あなたの相談に様々な視点で意見を出し合います。
            </p>
          </div>

          {/* Comparison Layout */}
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
            {/* Traditional Chat */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg sm:rounded-3xl sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <MessageCircle className="text-slate-600" size={24} />
                </div>
                <div>
                  <h3 className="font-shippori text-xl font-bold text-slate-900">通常のチャット</h3>
                  <p className="text-sm text-slate-500">1対1の対話形式</p>
                </div>
              </div>

              {/* Visual Representation */}
              <div className="mb-6 rounded-2xl bg-slate-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
                    <Image
                      src="/images/counselors/michelle.png"
                      alt="カウンセラー"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                      1人のカウンセラーと
                      <br />
                      じっくり対話
                    </div>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    ✓
                  </span>
                  <span>一貫した対話の流れ</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    ✓
                  </span>
                  <span>深い信頼関係を構築</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                    ✓
                  </span>
                  <span>シンプルで使いやすい</span>
                </li>
              </ul>
            </div>

            {/* Multi-Counseling Chat */}
            <div className="group relative overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50 p-6 shadow-xl shadow-orange-100/50 transition-all hover:shadow-2xl sm:rounded-3xl sm:p-8">
              {/* Premium Badge */}
              <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                PREMIUM
              </div>

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500">
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-shippori text-xl font-bold text-slate-900">
                    マルチカウンセリング
                  </h3>
                  <p className="text-sm text-orange-600">複数AIの多角的視点</p>
                </div>
              </div>

              {/* Visual Representation - Group Chat Style */}
              <div className="mb-6 rounded-2xl bg-white p-4 shadow-inner">
                {/* Multiple AI Icons Overlapping */}
                <div className="mb-4 flex items-center justify-center">
                  <div className="flex -space-x-3">
                    {counselorIcons.map((counselor, index) => (
                      <div
                        key={counselor.name}
                        className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white shadow-lg transition-transform hover:scale-110 hover:z-10"
                        style={{ zIndex: 10 - index }}
                      >
                        <Image src={counselor.image} alt={counselor.name} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Messages */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src="/images/counselors/michelle.png"
                        alt="Michelle"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="rounded-xl bg-pink-50 px-3 py-2 text-xs text-slate-700">
                      感情を大切にしましょう
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src="/images/counselors/dr_satou.png"
                        alt="Dr. Sato"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-slate-700">
                      科学的な視点では...
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image src="/images/counselors/alex.png" alt="Alex" fill className="object-cover" />
                    </div>
                    <div className="rounded-xl bg-green-50 px-3 py-2 text-xs text-slate-700">
                      実践的なアプローチは
                    </div>
                  </div>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-600">
                    ✓
                  </span>
                  <span className="font-medium">多角的な視点で深い気づき</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-600">
                    ✓
                  </span>
                  <span className="font-medium">専門家たちの意見を比較</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-600">
                    ✓
                  </span>
                  <span className="font-medium">より豊かな解決策の発見</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="mb-4 text-sm text-slate-600">
              マルチカウンセリングチャットは
              <span className="font-bold text-orange-600"> プレミアムプラン </span>
              でご利用いただけます
            </p>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-3 font-bold text-white shadow-lg shadow-orange-200 transition-all hover:scale-105 hover:shadow-xl hover:shadow-orange-300"
            >
              料金プランを見る
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
