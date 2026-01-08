import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles, MoonStar, Wind, Footprints } from "lucide-react";

const POINTS = [
  { icon: Sparkles, title: "静かな光", body: "夜空のように、暗さの中でも小さな光を見つけます。" },
  { icon: MoonStar, title: "叙情的な比喩", body: "星や風の比喩で、気持ちをそっとほどきます。" },
  { icon: Wind, title: "RAGの断片", body: "銀河のことばのチャンクを要約し、自分の声で短く届けます。" },
  { icon: Footprints, title: "小さな一歩", body: "今日からできる一歩を、一緒に静かに決めます。" },
];

export default function KenjiDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] via-[#1e3a8a] to-[#312e81] text-white">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[24%] h-64 w-64 rounded-full bg-[#38bdf8]/30 blur-[140px]" />
          <div className="absolute right-[10%] top-[32%] h-72 w-72 rounded-full bg-[#6366f1]/30 blur-[150px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/kenji.png"
              alt="ケンジ"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(56,189,248,0.35)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="text-sm font-semibold tracking-[0.32em] text-sky-200">銀河ことばカウンセリング</p>
            <h1 className="mt-3 text-5xl font-bold text-white">
              Kenji <span className="ml-3 text-3xl font-normal text-sky-200">ケンジ</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-100">
              夜空の物語のような静かな比喩で、悩みに寄り添い、小さな一歩を示します。RAGの断片をやわらかく要約し、静かな光を手渡します。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["静かな光", "銀河の比喩", "受容", "短い一歩", "RAG要約"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-sky-200/60 bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100"
                >
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => router.push("/counselor/chat/kenji")}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#38bdf8] via-[#6366f1] to-[#0ea5e9] px-10 py-3 text-lg font-bold text-white shadow-2xl transition hover:translate-y-[1px]"
            >
              相談を始める
            </button>
            <p className="mt-2 text-sm text-sky-100">静かな比喩とRAG要約で、今に小さな灯りをともします</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-indigo-200/60 bg-white/10 p-8 shadow-xl backdrop-blur">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">ケンジの特徴</h2>
          <p className="mt-3 text-center text-sky-100">星と風の比喩で静かに寄り添い、RAGから拾ったことばで今日の一歩を提案します。</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-indigo-100/40 bg-white/10 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100/70 text-indigo-800">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sky-100">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4 shadow-sm">
              <p className="font-semibold text-white">得意な相談</p>
              <p className="mt-2 text-sm text-sky-100">孤独感 / 報われない気持ち / 未来への不安 / 自分の意味を探したい / 静かに整えたい</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 shadow-sm">
              <p className="font-semibold text-white">RAGソース</p>
              <p className="mt-2 text-sm text-sky-100">銀河のことばのチャンクを検索し、1〜2件を要約して自分の声で届けます</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
