export default function ProblemSolutionSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-12 text-3xl font-bold text-slate-800 md:text-4xl">
            なぜ「AIカウンセリング事務所」なのか
          </h2>
          
          <div className="mb-16 grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl bg-red-50 p-8 text-left shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-red-800">
                既存の相談サービスの課題
              </h3>
              <ul className="space-y-4 text-slate-700">
                <li className="flex items-start">
                  <span className="mr-2 text-red-500">⚠</span>
                  <span>
                    <strong>一般的なLLMチャット：</strong>
                    耳障りの良いことしか言わず、根本的な解決にならない「迎合型」の回答が多い。
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-red-500">⚠</span>
                  <span>
                    <strong>人間のカウンセラー：</strong>
                    相性や経験不足により、かえって傷つけられるリスクがある。料金が高額で継続が困難。
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-emerald-50 p-8 text-left shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-emerald-800">
                当事務所の解決策
              </h3>
              <ul className="space-y-4 text-slate-700">
                <li className="flex items-start">
                  <span className="mr-2 text-emerald-500">✓</span>
                  <span>
                    <strong>専門家監修AI：</strong>
                    心理学の専門知識をRAG技術で学習。ただの共感だけでなく、適切な知識に基づいた対話が可能。
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-emerald-500">✓</span>
                  <span>
                    <strong>人間不在の安心感：</strong>
                    気を使わず、何度でも同じことを相談できる。プライバシーも完全守秘。
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-[40px] bg-white p-10 shadow-lg ring-1 ring-slate-100">
            <h3 className="mb-8 text-2xl font-bold text-slate-800">
              AIカウンセラーならではのメリット
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "24時間365日", desc: "深夜でも早朝でも、あなたのタイミングで即座に相談可能。" },
                { title: "圧倒的低価格", desc: "月額1,500円で使い放題。経済的な負担を気にせず継続できます。" },
                { title: "瞬時のレスポンス", desc: "待ち時間ゼロ。今すぐ聞いてほしいその気持ちに、その場で応答。" },
                { title: "心理的安全性", desc: "相手はAI。評価される恐れも、気を使う必要もありません。" },
                { title: "何度でも質問OK", desc: "理解できるまで何度聞いても、AIは決して疲れません。" },
                { title: "専門知識の実装", desc: "多様な心理療法のアプローチを学習した専門人格を用意。" },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <span className="text-xl">★</span>
                  </div>
                  <h4 className="mb-2 font-bold text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
