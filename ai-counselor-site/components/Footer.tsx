import Link from "next/link";

import NewsletterForm from "@/components/NewsletterForm";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <p className="text-lg font-bold text-slate-900">メンタルAIチーム</p>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
              24時間365日、あなたの心に寄り添うAIパートナー。人間不在の安心感と専門知の信頼性を、いつでも何度でも。
            </p>
            <NewsletterForm />
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm text-slate-700 md:grid-cols-3 md:justify-items-end">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">リンク</p>
              <Link href="/" className="block hover:text-slate-900">ホーム</Link>
              <Link href="/#counselors" className="block hover:text-slate-900">カウンセラー一覧</Link>
              <Link href="/team" className="block hover:text-slate-900">チームカウンセリング</Link>
              <Link href="/account" className="block hover:text-slate-900">マイページ</Link>
              <Link href="/login" className="block hover:text-slate-900">ログイン / 登録</Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">法的事項</p>
              <Link href="/legal/terms" className="block hover:text-slate-900">利用規約</Link>
              <Link href="/legal/privacy" className="block hover:text-slate-900">プライバシーポリシー</Link>
              <Link href="/legal/tokusho" className="block hover:text-slate-900">特定商取引法に基づく表記</Link>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">関連リンク</p>
              <Link href="https://namisapo.app/" target="_blank" rel="noreferrer" className="block hover:text-slate-900">
                かんじょうにっき
              </Link>
              <Link href="https://web.namisapo.com/" target="_blank" rel="noreferrer" className="block hover:text-slate-900">
                一般社団NAMIDAサポート協会
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mental AI Team. All rights reserved.</p>
          <p>Made with care for mental health.</p>
        </div>
      </div>
    </footer>
  );
}
