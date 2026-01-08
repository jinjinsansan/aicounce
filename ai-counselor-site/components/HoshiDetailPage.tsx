import { useEffect } from "react";
import Image from "next/image";
import { Sparkles, Heart, Eye, Footprints } from "lucide-react";

const POINTS = [
  { icon: Sparkles, title: "素朴なまなざし", body: "子どものように素直に、気持ちを受け止めます。" },
  { icon: Heart, title: "見えない大切さ", body: "目に見えないものを思い出す視点で、心をゆるめます。" },
  { icon: Eye, title: "RAGの灯り", body: "星の旅のチャンクを要約し、自分の声で短く伝えます。" },
  { icon: Footprints, title: "小さな一歩", body: "今日できる一歩を一つだけ、やさしく示します。" },
];

export default function HoshiDetailPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff7ed] via-[#fef3c7] to-[#fef9c3] text-slate-900">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[24%] h-64 w-64 rounded-full bg-[#fde68a]/70 blur-[140px]" />
          <div className="absolute right-[10%] top-[32%] h-72 w-72 rounded-full bg-[#fcd34d]/55 blur-[150px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/hoshi.png"
              alt="ホシ"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(251,191,36,0.28)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="text-sm font-semibold tracking-[0.32em] text-amber-700">星の旅カウンセリング</p>
            <h1 className="mt-3 text-5xl font-bold text-slate-900">
              Hoshi <span className="ml-3 text-3xl font-normal text-amber-700">ホシ</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-800">
              小さな星の旅の気づきをもとに、目に見えない大切なものを思い出させます。RAGで拾った灯りを短く要約し、やさしく一歩を示します。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["素朴", "大切なもの", "短い一歩", "RAG要約", "子どものまなざし"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-xs font-semibold text-amber-800"
                >
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              disabled
              aria-disabled="true"
              className="mt-10 inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-slate-300 px-10 py-3 text-lg font-bold text-slate-700 shadow-2xl"
            >
              HOSHIはチームカウンセリングチャット専用です
            </button>
            <p className="mt-2 text-sm text-amber-700">星の旅の視点で、チームカウンセリングで伴走します</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-amber-100 bg-white/95 p-8 shadow-xl">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">ホシの特徴</h2>
          <p className="mt-3 text-center text-amber-700">素朴な問いかけで感情を受け止め、RAGで拾った灯りを手渡しながら、小さな一歩を示します。</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-amber-100 bg-[#fffaf0] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">得意な相談</p>
              <p className="mt-2 text-sm text-slate-700">大切なものがわからない / 素直に話せない / 孤独感 / 小さな喜びを思い出したい / 子どもの視点</p>
            </div>
            <div className="rounded-2xl bg-white/95 p-4 shadow-sm">
              <p className="font-semibold text-slate-900">RAGソース</p>
              <p className="mt-2 text-sm text-slate-700">星の旅のチャンクを検索し、1〜2件を要約して自分の声で届けます</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
