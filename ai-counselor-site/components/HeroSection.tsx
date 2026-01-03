import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-[#fdfdfd] text-center shadow-sm ring-1 ring-slate-100 md:text-left">
      <div className="container mx-auto flex flex-col items-center px-6 py-16 md:flex-row md:justify-between md:px-12 md:py-24">
        
        {/* Text Content */}
        <div className="max-w-2xl space-y-6 md:pr-8">
          <div className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-sm font-bold tracking-wide text-blue-600">
            AI Counselor Office
          </div>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
            人間が一切存在しない、
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              AIだけのカウンセリング事務所
            </span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-600">
            AI駆動開発のプロフェッショナルと心理学の専門家がコラボレーション。
            <br className="hidden sm:block" />
            24時間365日、あなたの心に寄り添う専門家たちがここにいます。
          </p>
          
          <div className="flex flex-col gap-4 pt-4 sm:flex-row">
            <Link
              href="#counselors"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800 hover:shadow-lg"
            >
              カウンセラーを選ぶ
            </Link>
            <Link
              href="#about"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              事務所について
            </Link>
          </div>
        </div>

        {/* Visual Decoration (Abstract/Calming) */}
        <div className="mt-12 md:mt-0 relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-purple-100 opacity-50 blur-3xl rounded-full" />
          <div className="relative h-64 w-64 md:h-80 md:w-80 rounded-full bg-white p-6 shadow-xl ring-1 ring-slate-100 flex items-center justify-center">
             {/* Simple reliable icon or abstract shape */}
             <div className="text-center space-y-2">
                <span className="text-6xl">🌿</span>
                <p className="font-bold text-slate-800">Relax & Talk</p>
                <p className="text-xs text-slate-400">Privacy First</p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
