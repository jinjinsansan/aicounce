import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[40px] bg-[#FFF8F0] px-6 py-20 text-slate-800 shadow-sm ring-1 ring-orange-100/50 md:px-12 md:py-32">
      {/* Soft Background Blobs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-green-200/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-100/20 blur-[100px]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
        {/* Text Content */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-orange-600 shadow-sm ring-1 ring-orange-100">
            <span className="mr-2 flex h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            24時間365日 即時対応
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            もう、誰にも
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
              気を使わなくていい。
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 lg:mx-0">
            人間が一切介在しない、AIだけのカウンセリング事務所。<br/>
            臨床心理学からスピリチュアルまで、専門知識を学習したAIが<br className="hidden sm:inline"/>
            あなたの心に寄り添い、否定することなく話を聞き続けます。
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="#counselors"
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 transition duration-300 hover:bg-orange-400 hover:shadow-orange-300 sm:w-auto"
            >
              <span className="mr-2">カウンセラーを選ぶ</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="#about"
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-base font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 sm:w-auto"
            >
              事務所について
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 border-t border-slate-200 pt-8 lg:justify-start">
            <div>
              <p className="text-3xl font-bold text-slate-900">10名</p>
              <p className="text-xs text-slate-500">専門AIカウンセラー</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="text-3xl font-bold text-slate-900">0秒</p>
              <p className="text-xs text-slate-500">待ち時間</p>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="text-3xl font-bold text-slate-900">¥1,500</p>
              <p className="text-xs text-slate-500">月額使い放題</p>
            </div>
          </div>
        </div>

        {/* Visual Content */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-full">
          <div className="relative aspect-square overflow-visible rounded-[40px] border border-white/50 bg-white/40 backdrop-blur-md shadow-2xl ring-1 ring-white/60">
            <div className="relative h-full w-full overflow-hidden rounded-[40px]">
              <Image
                src="/images/hero_image.png"
                alt="AI Counselor Interface"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            
            {/* Floating Badges */}
            <div className="absolute -right-6 top-10 z-20 animate-bounce rounded-xl border border-white bg-white/90 px-4 py-2 text-xs font-bold text-orange-500 shadow-lg backdrop-blur-md delay-700">
              ✨ 秘密厳守
            </div>
            <div className="absolute -left-6 bottom-20 z-20 animate-bounce rounded-xl border border-white bg-white/90 px-4 py-2 text-xs font-bold text-blue-500 shadow-lg backdrop-blur-md">
              🌙 24H対応
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
