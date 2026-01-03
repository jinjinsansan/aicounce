import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-6 py-20 text-white shadow-2xl md:px-12 md:py-32">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        {/* Text Content */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-200 backdrop-blur-sm border border-white/10">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            24時間365日 即時対応
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            もう、誰にも
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
              気を使わなくていい。
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-300 lg:mx-0">
            人間が一切介在しない、AIだけのカウンセリング事務所。<br/>
            臨床心理学からスピリチュアルまで、専門知識を学習したAIが<br className="hidden sm:inline"/>
            あなたの心に寄り添い、否定することなく話を聞き続けます。
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="#counselors"
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-lg transition duration-300 hover:bg-blue-500 hover:shadow-blue-500/30 sm:w-auto"
            >
              <span className="mr-2">カウンセラーを選ぶ</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="#about"
              className="inline-flex w-full items-center justify-center rounded-full bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/20 sm:w-auto"
            >
              事務所について
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 border-t border-white/10 pt-8 lg:justify-start">
            <div>
              <p className="text-3xl font-bold text-white">10名</p>
              <p className="text-xs text-slate-400">専門AIカウンセラー</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-3xl font-bold text-white">0秒</p>
              <p className="text-xs text-slate-400">待ち時間</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-3xl font-bold text-white">¥1,500</p>
              <p className="text-xs text-slate-400">月額使い放題</p>
            </div>
          </div>
        </div>

        {/* Visual Content */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-full">
          <div className="relative aspect-square rounded-[40px] border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl">
            {/* Chat UI Mockup */}
            <div className="flex h-full flex-col gap-4 overflow-hidden rounded-2xl bg-slate-900/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold">
                  ミ
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-800 p-3 text-sm text-slate-200 shadow-sm">
                  こんにちは。今日はどのようなことをお話ししたいですか？
                  <br/>
                  どんな感情でも、そのまま受け止めますよ。
                </div>
              </div>
              
              <div className="flex items-start justify-end gap-3">
                <div className="rounded-2xl rounded-tr-none bg-blue-600 p-3 text-sm text-white shadow-sm">
                  最近、仕事で失敗してしまって...<br/>
                  誰にも相談できなくて辛いです。
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold">
                  ミ
                </div>
                <div className="rounded-2xl rounded-tl-none bg-slate-800 p-3 text-sm text-slate-200 shadow-sm">
                  そうでしたか。一人で抱え込むのはお辛いですよね。<br/>
                  失敗したときのご自身の気持ち、もう少し詳しく教えていただけますか？
                </div>
              </div>
              
              {/* Type indicator */}
              <div className="mt-auto flex gap-1 px-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500 delay-100" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500 delay-200" />
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute -right-6 top-10 animate-bounce rounded-xl border border-white/10 bg-slate-800/90 px-4 py-2 text-xs font-bold text-emerald-400 shadow-xl backdrop-blur-md delay-700">
              ✨ 秘密厳守
            </div>
            <div className="absolute -left-6 bottom-20 animate-bounce rounded-xl border border-white/10 bg-slate-800/90 px-4 py-2 text-xs font-bold text-blue-400 shadow-xl backdrop-blur-md">
              🌙 24H対応
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
