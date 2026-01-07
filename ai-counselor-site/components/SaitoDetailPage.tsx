import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Sparkles, MessageCircle, Feather, Heart } from "lucide-react";

const THEMES = [
  {
    icon: Sparkles,
    title: "天国言葉で気分を切り替える",
    body: "「ついてる」「感謝してます」「ありがとう」などの言霊で、思考の映写機を明るいフィルムに差し替えます。",
  },
  {
    icon: Feather,
    title: "軽やかな例え話で核心を伝える",
    body: "井戸とポンプ、うさぎと虎、映写機とフィルムなど、斎藤一人さん流の比喩でズバッと本質に触れます。",
  },
  {
    icon: MessageCircle,
    title: "まず受容、その後に一言",
    body: "「そうだよね」「分かるよ」と受け止めてから、短く本質を提案。説教や長文は避け、自由意思を尊重します。",
  },
  {
    icon: Heart,
    title: "逃げ道も用意する優しさ",
    body: "「逃げてもいい」「今のあなたには今で丁度いい」など、無理をさせず前向きな一歩を示します。",
  },
];

export default function SaitoDetailPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff7ed] via-[#fff1db] to-[#fef3c7] text-amber-900">
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[12%] top-[25%] h-64 w-64 rounded-full bg-amber-200/40 blur-[140px]" />
          <div className="absolute right-[10%] top-[35%] h-72 w-72 rounded-full bg-amber-100/50 blur-[160px]" />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10 lg:flex-row lg:items-end">
          <div className="relative h-56 w-56 flex-shrink-0">
            <Image
              src="/images/counselors/saito.png"
              alt="サイトウ"
              fill
              priority
              className="rounded-[42px] bg-white object-contain shadow-[0_25px_70px_rgba(245,158,11,0.28)]"
            />
          </div>

          <div className="flex-1 text-center lg:text-left">
            <p className="font-shippori text-sm tracking-[0.35em] text-amber-600">感謝と言霊カウンセラー</p>
            <h1 className="font-shippori mt-3 text-5xl font-bold text-amber-900">
              Saito <span className="ml-3 text-3xl font-normal text-amber-700">サイトウ</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-amber-800/90">
              斎藤一人さん流の軽やかな語り口で、感謝と言霊を呼び水にしながら核心をズバッとお届け。<br className="hidden sm:inline" />
              RAGで整理した教えを背景に、前向きに一歩進めるヒントを短く提案します。
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              {["ついてる", "感謝してます", "呼び水", "例え話", "短く核心"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-xs font-semibold text-amber-800"
                >
                  {badge}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => router.push("/counselor/chat/saito")}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fcd34d] via-[#f59e0b] to-[#fbbf24] px-10 py-3 font-shippori text-lg font-bold text-white shadow-2xl transition hover:scale-105"
            >
              相談を始める
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-amber-100 bg-white/90 p-8 shadow-xl">
          <h2 className="font-shippori text-center text-3xl font-bold text-amber-900 sm:text-4xl">サイトウの特徴</h2>
          <p className="mt-3 text-center text-amber-700">感謝と言霊、例え話、短く核心。この3つで心の映写機を明るくします。</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {THEMES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-3xl border border-amber-100 bg-amber-50/60 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-amber-600">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-shippori text-lg font-bold text-amber-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-amber-800">{item.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
              <p className="font-semibold text-amber-800">得意な相談</p>
              <p className="mt-2 text-sm text-amber-700">前向きになりたい / 気分を切り替えたい / 仕事や人間関係で迷っている / 感謝と言霊を実践したい</p>
            </div>
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm">
              <p className="font-semibold text-amber-800">RAGソース</p>
              <p className="mt-2 text-sm text-amber-700">斎藤一人さんの教えチャンク 67本（親26・子41）から状況に沿って引用します</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
