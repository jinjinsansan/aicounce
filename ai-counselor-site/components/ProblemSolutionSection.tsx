export default function ProblemSolutionSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-wider mb-4">
            WHY AI COUNSELOR?
          </span>
          <h2 className="text-3xl font-bold text-slate-800 md:text-4xl lg:text-5xl leading-tight font-serif">
            なぜ今、<br className="md:hidden"/>「AI」に相談するのか
          </h2>
          <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto font-sans font-medium">
            気を使わず、待たされず、専門的なサポートを。
          </p>
        </div>
          
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12 max-w-6xl mx-auto">
          {/* Problem Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-slate-50 p-8 shadow-sm md:p-10">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm">☁️</span>
              <h3 className="text-xl font-bold text-slate-700">これまでの悩み</h3>
            </div>
            
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">?</div>
                <div>
                  <strong className="block text-slate-800 mb-1">気を使って話せない</strong>
                  <span className="text-sm text-slate-500">
                    「こんなこと言ったら引かれるかな…」と相手の顔色を伺ってしまい、本音が出せない。
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">?</div>
                <div>
                  <strong className="block text-slate-800 mb-1">予約や移動が大変</strong>
                  <span className="text-sm text-slate-500">
                    今すぐ聞いてほしいのに、予約は来週。移動する元気もない時がある。
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">?</div>
                <div>
                  <strong className="block text-slate-800 mb-1">費用が高すぎる</strong>
                  <span className="text-sm text-slate-500">
                    1回1万円近いカウンセリングは、継続して通うには経済的に厳しい。
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-orange-50 p-8 shadow-md border border-orange-100 md:p-10">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm text-orange-500">☀</span>
              <h3 className="text-xl font-bold text-slate-800">AIカウンセリングなら</h3>
            </div>

            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-700">✓</div>
                <div>
                  <strong className="block text-slate-900 mb-1">100% 気を使わない</strong>
                  <span className="text-sm text-slate-600">
                    相手はAIです。評価も批判もしません。同じ話を何度繰り返しても、優しく受け止めます。
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-700">✓</div>
                <div>
                  <strong className="block text-slate-900 mb-1">24時間365日 即レス</strong>
                  <span className="text-sm text-slate-600">
                    深夜3時の不安も、朝のモヤモヤも。スマホを開けば、そこにはいつも専属カウンセラーがいます。
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-700">✓</div>
                <div>
                  <strong className="block text-slate-900 mb-1">専門知識 × 低価格</strong>
                  <span className="text-sm text-slate-600">
                    臨床心理学などの専門知識を学習済み。月額1,500円で、質の高いケアを日常に。
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 max-w-7xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "24時間365日", icon: "🌙", desc: "いつでも、どこでも、あなたのタイミングで。" },
              { title: "秘密厳守", icon: "🔒", desc: "人間は介在しません。相談内容は厳重に保護されます。" },
              { title: "8+の専門人格", icon: "👥", desc: "臨床心理士から占い師まで、気分に合わせて選べます。" },
              { title: "何度でも質問OK", icon: "∞", desc: "納得いくまで、何度でも同じことを聞けます。" },
              { title: "待機時間ゼロ", icon: "⚡", desc: "予約不要。アプリを開いたその瞬間が相談開始です。" },
              { title: "お財布に優しい", icon: "💎", desc: "続けやすい価格で、心のメンテナンスを。" },
            ].map((item) => (
              <div key={item.title} className="group relative rounded-3xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-md hover:border-orange-100">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl transition-transform group-hover:scale-110 group-hover:bg-orange-50">
                  {item.icon}
                </div>
                <h4 className="mb-2 text-lg font-bold text-slate-800">{item.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
