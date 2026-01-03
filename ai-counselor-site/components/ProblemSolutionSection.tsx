export default function ProblemSolutionSection() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-wider mb-4">
            WHY AI COUNSELOR?
          </span>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl lg:text-5xl leading-tight">
            なぜ今、<br className="md:hidden"/>「AI」に相談するのか
          </h2>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto">
            従来のカウンセリングやチャットボットが抱えていた課題を、
            最新のAI技術と専門家の知見で解決しました。
          </p>
        </div>
          
        <div className="grid gap-8 md:grid-cols-2 lg:gap-12 max-w-6xl mx-auto">
          {/* Problem Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-red-100 md:p-10">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-red-50 blur-2xl" />
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl">😫</span>
                <h3 className="text-xl font-bold text-slate-800">従来の相談サービスの課題</h3>
              </div>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-red-50/50">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">✕</div>
                  <div>
                    <strong className="block text-slate-900 mb-1">ただの「共感」で終わる</strong>
                    <span className="text-sm text-slate-600">
                      一般的なAIチャットは迎合的で、耳障りの良いことしか言わないため、根本解決に至らないことが多い。
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-red-50/50">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">✕</div>
                  <div>
                    <strong className="block text-slate-900 mb-1">人間関係のリスク</strong>
                    <span className="text-sm text-slate-600">
                      相性が合わなかったり、未熟なカウンセラーに当たって傷つくリスクがある。予約の手間も心理的ハードルに。
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 transition-colors hover:bg-red-50/50">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">✕</div>
                  <div>
                    <strong className="block text-slate-900 mb-1">高額な費用</strong>
                    <span className="text-sm text-slate-600">
                      専門家のカウンセリングは1回数千円〜数万円が相場。継続的に通うのは経済的に困難。
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Solution Card */}
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-xl text-white md:p-10 transform md:-translate-y-4">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-40 w-40 rounded-full bg-indigo-500/30 blur-2xl" />
            
            <div className="relative z-10">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">✨</span>
                <h3 className="text-xl font-bold text-white">当事務所の解決策</h3>
              </div>

              <ul className="space-y-6">
                <li className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/20">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-900">✓</div>
                  <div>
                    <strong className="block text-white mb-1">RAG技術による「専門知」</strong>
                    <span className="text-sm text-blue-100">
                      臨床心理学や認知行動療法など、専門家の知識データベースを参照。ただの会話ではなく「メソッド」に基づいた対話を提供。
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/20">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-900">✓</div>
                  <div>
                    <strong className="block text-white mb-1">100%の心理的安全性</strong>
                    <span className="text-sm text-blue-100">
                      相手はAI。評価されることも、否定されることもありません。深夜でも、同じことを何度聞いても、常に優しく受け止めます。
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/20">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-900">✓</div>
                  <div>
                    <strong className="block text-white mb-1">圧倒的なアクセシビリティ</strong>
                    <span className="text-sm text-blue-100">
                      月額1,500円で使い放題。24時間365日、予約不要。あなたのポケットに、専属のメンタルケアチームを。
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 max-w-7xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "24時間365日", icon: "🌙", desc: "深夜3時の不安も、早朝のモヤモヤも。いつでも即座に対応します。" },
              { title: "プライバシー完備", icon: "🔒", desc: "人間は介在しません。相談内容は厳重に暗号化され、誰にも見られません。" },
              { title: "8+の専門人格", icon: "👥", desc: "臨床心理士、キャリアコーチ、占い師など、気分に合わせて相手を選べます。" },
              { title: "何度でも質問OK", icon: "∞", desc: "「さっきも聞いたけど...」という遠慮は不要。納得いくまで何度でも。" },
              { title: "待機時間ゼロ", icon: "⚡", desc: "予約も待ち時間もありません。アプリを開いたその瞬間が、相談開始の時間です。" },
              { title: "破格の安さ", icon: "💎", desc: "対面カウンセリング1回分の料金で、1ヶ月間いつでも何度でも話し放題。" },
            ].map((item) => (
              <div key={item.title} className="group relative rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl transition-transform group-hover:scale-110 group-hover:bg-blue-100">
                  {item.icon}
                </div>
                <h4 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
