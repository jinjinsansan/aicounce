import { SectionHeading } from "@/components/SectionHeading";

const faqs = [
  {
    question: "利用料金はかかりますか？",
    answer:
      "ベーシックプラン（月額500円）で個別カウンセリング、プレミアムプラン（月額1,500円）で個別＋チームカウンセリングをご利用いただけます。現在はベータ期間中のため、公式LINEを追加すると個別・チームを含むすべての機能を無期限で無料開放しています。",
  },
  {
    question: "AIとの会話は誰かに見られませんか？",
    answer:
      "いいえ、誰にも見られません。会話データは厳重に暗号化され、開発者も含めて人間が内容を閲覧することは一切ありません。安心してお話しください。",
  },
  {
    question: "どのようにカウンセラーを選べばよいですか？",
    answer:
      "「なんとなく話したい」時はミシェルやアダム、「具体的な悩み」がある時はドクター・サトウやアレックスなど。気分や目的に合わせて、直感で選んでいただいて構いません。",
  },
  {
    question: "解約はいつでもできますか？",
    answer:
      "はい、マイページからいつでも解約可能です。契約期間の縛りや違約金などは一切ございません。",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="rounded-none bg-slate-50 px-4 py-12 sm:rounded-3xl sm:px-6 sm:py-24 md:rounded-[40px] md:px-12">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title="よくあるご質問"
          description="みなさまから寄せられる質問をまとめました。"
          align="center"
        />
        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl bg-white p-4 shadow-none ring-0 transition-all sm:rounded-3xl sm:p-6 sm:shadow-sm sm:ring-1 sm:ring-slate-100 hover:shadow-md open:ring-orange-100"
            >
              <summary className="flex cursor-pointer items-center justify-between text-lg font-bold text-slate-800 marker:content-none">
                {faq.question}
                <span className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-open:rotate-180 group-open:bg-orange-100 group-open:text-orange-600">
                  ⌄
                </span>
              </summary>
              <p className="mt-4 text-base leading-relaxed text-slate-600 animate-in fade-in slide-in-from-top-2 duration-200">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
