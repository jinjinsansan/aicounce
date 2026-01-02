import { SectionHeading } from "@/components/SectionHeading";

const features = [
  {
    title: "マルチLLMアーキテクチャ",
    description:
      "OpenAI / Gemini / Claude / Deepseekを即座に切り替え、カウンセラーごとに最適なモデルを割り当て。",
    detail: "モデル切替、コスト管理、推論ログまでSupabaseで一元追跡",
  },
  {
    title: "RAG親子チャンク構造",
    description:
      "YouTube文字起こし・専門ドキュメントを親子チャンク化し、高精度な文脈検索を実現。",
    detail: "ベクトル検索 + メタデータで応答根拠を提示",
  },
  {
    title: "アクセシビリティ設計",
    description:
      "WCAG 2.1 AAに沿った配色とフォーカス制御で、誰でもストレスなく利用可能。",
    detail: "キーボード操作 / スクリーンリーダー最適化",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="space-y-10 rounded-[32px] bg-white/80 p-10 shadow-lg">
      <SectionHeading
        eyebrow="Features"
        title="テープ式心理学の知と最新AI基盤を融合"
        description="Supabase + Next.js + Tailwindで構築した堅牢なAIカウンセリング基盤。"
      />

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-6"
          >
            <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-blue-600">
              {feature.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
