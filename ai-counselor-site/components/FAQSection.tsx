import { SectionHeading } from "@/components/SectionHeading";

const faqs = [
  {
    question: "利用料金はかかりますか？",
    answer:
      "基本プランは無料で利用でき、RAG検索トークンやマルチモデル切替に応じて従量課金を予定しています。",
  },
  {
    question: "個人情報や会話ログは安全ですか？",
    answer:
      "SupabaseのRLSと暗号化ポリシーを適用し、会話ログは90日で自動アーカイブされます。",
  },
  {
    question: "どのようにカウンセラーを選べばよいですか？",
    answer:
      "専門分野・得意アプローチ・RAG対応可否を比較し、現在のテーマに最も近いカウンセラーを選択してください。",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="space-y-10 rounded-[32px] bg-slate-900 p-10 text-white">
      <SectionHeading
        eyebrow="FAQ"
        title="よくあるご質問"
        description="セキュリティ・料金・導入に関する代表的な質問をまとめました。"
        align="left"
      />
      <div className="space-y-6">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <summary className="cursor-pointer text-lg font-semibold">
              {faq.question}
            </summary>
            <p className="mt-3 text-sm text-white/80">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
