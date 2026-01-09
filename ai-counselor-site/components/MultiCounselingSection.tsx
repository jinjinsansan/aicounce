import Image from "next/image";
import { MessageCircle, Users } from "lucide-react";

export default function MultiCounselingSection() {
  const counselorIcons = [
    { name: "Michelle", image: "/images/counselors/michelle.png" },
    { name: "Dr. Sato", image: "/images/counselors/dr_satou.png" },
    { name: "Dale", image: "/dale.png" },
    { name: "Mirai", image: "/mirai.png" },
    { name: "Pina", image: "/images/counselors/pina.png" },
    { name: "Yuki", image: "/images/counselors/yuki.png" },
    { name: "Mitsu", image: "/images/counselors/mitsu.png" },
    { name: "Muu", image: "/images/counselors/muu.png" },
    { name: "Kenji", image: "/images/counselors/kenji.png" },
    { name: "Hoshi", image: "/images/counselors/hoshi.png" },
    { name: "Nana", image: "/images/counselors/nana.png" },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 text-center sm:mb-16">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
            PREMIUM FEATURE
          </span>
          <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
            チームカウンセリングチャット
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg">
            複数のAIカウンセラーが同時に、あなたの相談に多角的な視点を提示します。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <MessageCircle className="text-slate-700" size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">通常のチャット</h3>
                <p className="text-sm text-slate-500">1対1でじっくり</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg">
                  <Image src="/images/counselors/michelle.png" alt="カウンセラー" fill className="object-contain" />
                </div>
                <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  1人のカウンセラーと落ち着いて対話
                </div>
              </div>
            </div>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              {["一貫した対話の流れ","深い信頼関係を構築","シンプルで使いやすい"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 block h-2 w-2 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Users size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">チームカウンセリング</h3>
                <p className="text-sm text-slate-500">複数AIの意見を同時に</p>
              </div>
            </div>

            <div className="mb-5 flex items-center gap-3">
              <div className="flex -space-x-3">
                {counselorIcons.map((c, idx) => (
                  <div
                    key={c.name}
                    className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-200 bg-white"
                    style={{ zIndex: 10 - idx }}
                  >
                    <Image src={c.image} alt={c.name} fill className="object-contain" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <div className="relative h-7 w-7 overflow-hidden rounded-md bg-white">
                  <Image src="/images/counselors/michelle.png" alt="Michelle" fill className="object-contain" />
                </div>
                <div className="rounded-lg bg-white px-3 py-2 shadow-sm">感情を大切にしましょう</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="relative h-7 w-7 overflow-hidden rounded-md bg-white">
                  <Image src="/images/counselors/dr_satou.png" alt="Dr. Sato" fill className="object-contain" />
                </div>
                <div className="rounded-lg bg-white px-3 py-2 shadow-sm">科学的な視点では…</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="relative h-7 w-7 overflow-hidden rounded-md bg-white">
                  <Image src="/dale.png" alt="Dale" fill className="object-contain" />
                </div>
                <div className="rounded-lg bg-white px-3 py-2 shadow-sm">実践的なアプローチは</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="relative h-7 w-7 overflow-hidden rounded-md bg-white">
                  <Image src="/mirai.png" alt="Mirai" fill className="object-contain" />
                </div>
                <div className="rounded-lg bg-white px-3 py-2 shadow-sm">未来ノートからヒントを出すね</div>
              </div>
            </div>

            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              {["多角的な視点で深い気づき","意見を並べて比較できる","解決策の幅が広がる"].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 block h-2 w-2 rounded-full bg-slate-900" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-slate-600">
          チームカウンセリングチャットは <span className="font-semibold text-slate-900">プレミアムプラン</span> でご利用いただけます
        </div>
      </div>
    </section>
  );
}
