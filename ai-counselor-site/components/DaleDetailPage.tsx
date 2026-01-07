import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, BookOpen, Target, Anchor, Compass } from "lucide-react";

const PILLARS = [
  {
    icon: BookOpen,
    title: "原則を知る",
    body: "『道は開ける』の不安対処・人間関係の原則を平易にまとめて提示します。",
  },
  {
    icon: Target,
    title: "行動に落とす",
    body: "今日できる小さなステップに分解し、後回しを減らすための具体策を提案します。",
  },
  {
    icon: Anchor,
    title: "心を安定させる",
    body: "最悪を受け入れる/再設計するフレームで、感情のアンカーを落ち着かせます。",
  },
  {
    icon: Compass,
    title: "焦点を定める",
    body: "影響できる領域に集中し、問題をコントロール可能な部分へ切り分けます。",
  },
];

export default function DaleDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1224] via-[#0f1e34] to-[#0f2744] text-white">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[25%] h-64 w-64 rounded-full bg-[#1d4ed8]/30 blur-[140px]" />
          <div className="absolute right-[10%] top-[35%] h-72 w-72 rounded-full bg-[#38bdf8]/25 blur-[160px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/dale.png"
              alt="デール"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(56,189,248,0.28)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="font-shippori text-sm tracking-[0.35em] text-sky-200">自己啓発カウンセリング</p>
            <h1 className="font-shippori mt-3 text-5xl font-bold text-white">
              Dale <span className="ml-3 text-3xl font-normal text-sky-200">デール</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-100/90">
              『道は開ける』の原則をもとに、不安を受け止めつつ行動へつなげる伴走者。<br className="hidden sm:inline" />
              最悪を想定して受け入れる→再設計→小さく動く、を短く提案します。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["道は開ける", "不安対処", "行動ステップ", "最悪を受け入れる", "フォーカス"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-sky-500/40 bg-white/10 px-4 py-2 text-xs font-semibold text-sky-100"
                >
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => router.push("/counselor/chat/dale")}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#38bdf8] via-[#2563eb] to-[#0ea5e9] px-10 py-3 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105"
            >
              相談を始める
              <ArrowRight size={20} />
            </button>
            <p className="mt-2 text-sm text-sky-100/80">『道は開ける』RAGを用いて回答します</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-sky-500/30 bg-white/5 p-8 shadow-xl backdrop-blur-sm">
          <h2 className="font-shippori text-center text-3xl font-bold text-white sm:text-4xl">デールの進め方</h2>
          <p className="mt-3 text-center text-sky-100/80">原則→分解→行動の順で、迷いを具体的な一歩に変えます。</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-sky-500/30 bg-[#0f1e34]/60 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-shippori text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sky-100/90">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-500/20 bg-white/10 p-4 shadow-sm backdrop-blur">
              <p className="font-semibold text-white">得意な相談</p>
              <p className="mt-2 text-sm text-sky-100/90">不安や心配事の整理 / 優先順位づけ / 先延ばしの打破 / 人間関係の改善</p>
            </div>
            <div className="rounded-2xl border border-sky-500/20 bg-white/10 p-4 shadow-sm backdrop-blur">
              <p className="font-semibold text-white">RAGソース</p>
              <p className="mt-2 text-sm text-sky-100/90">『道は開ける』関連原則を整理したチャンクを参照予定（準備中）</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
