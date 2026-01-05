import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <video
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/pixta_102837788_NTSC_D1.mp4" type="video/mp4" />
      </video>

      <div className="relative mx-auto w-full max-w-5xl space-y-10">
        <div className="space-y-6 text-center sm:text-left">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            メンタルAIチーム
          </h1>
          <p className="text-2xl font-semibold leading-tight text-slate-800 sm:text-3xl">
            人間が一切介在しない、AIだけのカウンセリングチーム。もう、誰にも気を使わなくていい。
          </p>
          <p className="text-lg leading-relaxed text-slate-600 sm:text-xl">
            様々なプロフェッショナルAIカウンセラーがあなたの心の声を優しく聴きます。
          </p>
        </div>

        <div className="flex justify-center sm:justify-start">
          <Link
            href="#counselors"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-black"
          >
            カウンセラーを選ぶ
          </Link>
        </div>
      </div>
    </section>
  );
}
