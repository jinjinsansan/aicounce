import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約 | メンタルAIチーム",
  description: "メンタルAIチームをご利用いただく際の利用規約です。サービス利用の前に必ずご確認ください。",
};

const sections = [
  {
    title: "第1条（適用）",
    body:
      "本規約は、一般社団法人NAMIDAサポート協会（以下「当協会」）が提供するメンタルAIチーム（以下「本サービス」）の利用に関する一切の関係に適用されます。利用者は本規約に同意した上で本サービスを利用するものとします。",
  },
  {
    title: "第2条（アカウント管理）",
    body:
      "利用者は、登録情報に虚偽がないよう正確な情報を届け出るものとし、ログイン情報を第三者へ貸与・譲渡してはなりません。ログイン情報の管理不備により生じた損害について、当協会は責任を負いません。",
  },
  {
    title: "第3条（サービス内容および免責）",
    body:
      "本サービスはAIカウンセリングチャットを通じてメンタルサポートを提供しますが、疾病の治癒・改善を保証するものではありません。AIは最新かつ正確な情報提供に努めますが、誤った情報を提示する可能性があることを利用者は承諾するものとします。医師等の専門家による診断や治療を必要とする場合は、必ず専門機関へご相談ください。",
  },
  {
    title: "第4条（月額料金および支払い）",
    body:
      "本サービスの利用料金はプランごとに定められた月額制です。お支払いは申込時点で開始され、理由の如何を問わず返金には応じられません。利用者はクレジットカードまたは銀行振込により所定の方法で支払いを行うものとします。",
  },
  {
    title: "第5条（禁止事項）",
    body:
      "以下の行為を禁止します。1) 法令または公序良俗に違反する行為、2) 当協会や第三者の権利を侵害する行為、3) 本サービスの運営を妨害する行為、4) AIが出力した内容を悪用し誤情報を流布する行為、5) その他当協会が不適切と判断する行為。",
  },
  {
    title: "第6条（サービスの停止・変更）",
    body:
      "当協会は、システム保守や不可抗力等により事前の予告なく本サービスを停止または変更する場合があります。これにより利用者に生じた損害について、当協会は責任を負いません。",
  },
  {
    title: "第7条（契約解除）",
    body:
      "利用者が本規約に違反した場合、または当協会が利用継続を不適切と判断した場合、利用者への事前通知なくアカウント停止・契約解除を行うことがあります。",
  },
  {
    title: "第8条（免責事項）",
    body:
      "本サービスの利用により利用者に発生した損害について、当協会は故意または重過失がある場合を除き責任を負いません。利用者が本サービスを通じて得た情報に基づき行う一切の行為は、利用者自身の判断と責任において行うものとします。",
  },
  {
    title: "第9条（知的財産権）",
    body:
      "本サービスに含まれるコンテンツ、プログラム、デザイン等の知的財産権は当協会または正当な権利を有する第三者に帰属します。利用者はこれらを無断で複製・転用・改変してはなりません。",
  },
  {
    title: "第10条（規約の変更）",
    body:
      "当協会は必要に応じて本規約を変更できます。変更後の規約はサービス上への掲示またはメール等で告知した時点から効力を生じるものとし、利用者は変更後もサービスを利用することで規約変更に同意したものとみなされます。",
  },
  {
    title: "第11条（準拠法・管轄）",
    body:
      "本規約の準拠法は日本法とし、本サービスに関して当協会と利用者との間で紛争が生じた場合には、東京地方裁判所または東京簡易裁判所を第一審の専属的合意管轄裁判所とします。",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Legal</p>
          <h1 className="text-3xl font-bold text-slate-900">利用規約</h1>
          <p className="text-sm text-slate-600">
            本サービスをご利用いただく前に、本規約を必ずお読みください。ご利用開始をもって、本規約に同意いただいたものとみなします。
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-semibold">重要なお知らせ</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>AIカウンセリングチャットは疾病の治癒・改善を保証するものではありません。</li>
            <li>AIが誤った情報を出力する可能性があります。重要な判断は専門家へご相談ください。</li>
            <li>月額料金は理由の如何に関わらず返金不可となります。</li>
          </ul>
        </div>

        <div className="mt-8 text-sm text-slate-500">
          <p>2026年1月5日 制定</p>
          <p>
            運営：一般社団法人NAMIDAサポート協会 / お問い合わせ：
            <Link href="mailto:info@namisapo.com" className="underline decoration-slate-300 hover:decoration-slate-500">
              info@namisapo.com
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
