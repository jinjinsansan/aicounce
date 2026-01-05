export default function ProblemSolutionSection() {
  return (
    <section className="bg-white py-20" id="about">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
            WHY AI COUNSELOR?
          </span>
          <h2 className="mt-6 text-3xl font-black leading-tight text-slate-900 md:text-4xl">
            なぜ今、「AI」に相談するのか
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            人に話すのがつらいときこそ、誰にも気を使わない相手が必要です。
            <span className="hidden sm:inline">
              <br />
            </span>
            <span className="sm:inline">{" "}私たちは「絶対的な安心感」をAIで届けます。</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-8 space-y-4">
            <p className="text-sm font-semibold text-slate-500">抱えているモヤモヤ</p>
            <h3 className="text-2xl font-bold text-slate-900">人に話すと、気を遣う。</h3>
            <ul className="space-y-3 text-sm text-slate-700">
              {["本音を言うと角が立つ気がする","予約も移動も面倒、今すぐ聞いてほしい","対面は高額で続けにくい"].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-4">
            <p className="text-sm font-semibold text-slate-500">AIができること</p>
            <h3 className="text-2xl font-bold text-slate-900">気遣いゼロで、すぐに相談。</h3>
            <ul className="space-y-3 text-sm text-slate-700">
              {["批判も評価もしない、100%心理的安全性","待ち時間0秒、24時間365日即レス","専門知識を学んだ10人が月額1,980円で伴走"].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-slate-900" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
