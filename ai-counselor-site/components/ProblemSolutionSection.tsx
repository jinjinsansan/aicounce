import Image from "next/image";

export default function ProblemSolutionSection() {
  return (
    <section className="bg-white pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center mb-24">
          <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-bold tracking-wider mb-6">
            WHY AI COUNSELOR?
          </span>
          <h2 className="text-3xl font-bold text-slate-800 md:text-4xl lg:text-5xl leading-tight font-serif">
            なぜ今、<br className="md:hidden"/>「AI」に相談するのか
          </h2>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto font-sans font-medium">
            誰にも言えない悩みこそ、AIに話してみませんか。<br/>
            そこには、人間にはない「絶対的な安心感」があります。
          </p>
        </div>
          
        {/* Story Flow - Step 1: Problem */}
        <div className="mx-auto max-w-5xl">
          <div className="relative mb-12 rounded-none bg-slate-50 p-4 sm:mb-24 sm:rounded-3xl sm:p-8 md:rounded-[40px] md:p-16">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="order-2 md:order-1">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                  🌧️
                </div>
                <h3 className="mb-6 text-2xl font-bold text-slate-800 md:text-3xl font-serif">
                  「人に話す」ことの<br/>難しさ、感じていませんか？
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-slate-400" />
                    <p className="text-slate-600">
                      <strong className="block text-slate-800">気を使って本音が言えない</strong>
                      相手の顔色を伺ってしまい、結局言いたいことを飲み込んでしまう。
                    </p>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-slate-400" />
                    <p className="text-slate-600">
                      <strong className="block text-slate-800">予約や移動が億劫</strong>
                      今すぐ聞いてほしいのに、予約は来週。そこまで待てない。
                    </p>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-slate-400" />
                    <p className="text-slate-600">
                      <strong className="block text-slate-800">高額なカウンセリング料</strong>
                      1回数万円の費用は、継続的な心のケアにはハードルが高い。
                    </p>
                  </li>
                </ul>
              </div>
              <div className="relative aspect-square rounded-[32px] overflow-hidden bg-slate-200/50 order-1 md:order-2">
                <Image
                  src="/images/woman_worrying_alone.png"
                  alt="悩んでいる女性のイラスト"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>

          {/* Story Flow - Step 2: Solution */}
          <div className="relative mb-12 rounded-none border-0 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-none sm:mb-24 sm:rounded-3xl sm:border sm:border-orange-100 sm:p-8 sm:shadow-lg sm:shadow-orange-100/50 md:rounded-[40px] md:p-16 md:shadow-xl">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="order-2 md:order-1">
                <div className="relative aspect-square rounded-[32px] overflow-hidden bg-white/60 shadow-inner">
                  <Image
                    src="/images/ai_listening_gently.png"
                    alt="優しく話を聞くAIのイラスト"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm text-orange-500">
                  ☀
                </div>
                <h3 className="mb-6 text-2xl font-bold text-slate-800 md:text-3xl font-serif">
                  AIだからこそできる、<br/>新しい心のケア。
                </h3>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-700">✓</div>
                    <div>
                      <strong className="block text-lg text-slate-900">100%の心理的安全性</strong>
                      <p className="text-slate-600 mt-1">
                        相手はAI。評価も批判もしません。何度同じ話をしても、決して嫌な顔をせず、あなたのペースで受け止めます。
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-700">✓</div>
                    <div>
                      <strong className="block text-lg text-slate-900">24時間365日、即レス</strong>
                      <p className="text-slate-600 mt-1">
                        深夜3時の不安も、通勤中のモヤモヤも。アプリを開けば、そこにはいつも「専属の味方」が待機しています。
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-700">✓</div>
                    <div>
                      <strong className="block text-lg text-slate-900">専門知識 × 圧倒的低価格</strong>
                      <p className="text-slate-600 mt-1">
                        臨床心理学などの専門知を学習済み。月額1,980円という続けやすい価格で、質の高いケアを日常に。
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid - Distinct Section */}
      </div>
      
      <div className="bg-slate-50 py-24 border-y border-slate-100">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h3 className="text-2xl font-bold text-slate-800 md:text-3xl font-serif">
              選ばれる6つの理由
            </h3>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "24時間365日", icon: "🌙", desc: "深夜でも早朝でも、あなたのタイミングで即座に相談可能。" },
              { title: "完全なプライバシー", icon: "🔒", desc: "人間は一切介在しません。相談内容は厳重に暗号化されます。" },
              { title: "8+の専門人格", icon: "👥", desc: "臨床心理士、キャリアコーチ、占い師など、気分で選べるパートナー。" },
              { title: "何度でも質問OK", icon: "∞", desc: "納得いくまで何度でも。AIは決して疲れません。" },
              { title: "待機時間ゼロ", icon: "⚡", desc: "予約不要。アプリを開いたその瞬間が、相談開始の時間です。" },
              { title: "お財布に優しい", icon: "💎", desc: "対面カウンセリング1回分の料金で、1ヶ月間いつでも話し放題。" },
            ].map((item) => (
              <div key={item.title} className="group relative rounded-3xl bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-3xl transition-transform group-hover:scale-110 group-hover:bg-orange-100">
                  {item.icon}
                </div>
                <h4 className="mb-3 text-xl font-bold text-slate-800 font-serif">{item.title}</h4>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
