import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative w-full bg-slate-900 text-white">
      {/* Decorative Image Strip - Reduced height */}
      <div className="relative w-full h-32 md:h-48 overflow-hidden">
        <Image
          src="/images/footer.png"
          alt="Footer Background"
          fill
          className="object-cover opacity-40 object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>
      
      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white p-1">
                <Image
                  src="/images/logo_square.png"
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-2xl font-bold font-serif">AIカウンセリング事務所</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              24時間365日、あなたの心に寄り添うAIパートナー。<br />
              人間不在の安心感と、専門知の信頼性をあなたに。<br />
              いつでも、何度でも、気兼ねなくお話しください。
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-slate-200 border-b border-slate-800 pb-2 inline-block">リンク</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link href="/" className="hover:text-orange-400 transition flex items-center gap-2"><span>›</span>ホーム</Link></li>
              <li><Link href="/#counselors" className="hover:text-orange-400 transition flex items-center gap-2"><span>›</span>カウンセラー一覧</Link></li>
              <li><Link href="/#about" className="hover:text-orange-400 transition flex items-center gap-2"><span>›</span>事務所について</Link></li>
              <li><Link href="/login" className="hover:text-orange-400 transition flex items-center gap-2"><span>›</span>ログイン / 登録</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-slate-200 border-b border-slate-800 pb-2 inline-block">法的事項</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-orange-400 transition flex items-center gap-2"><span>›</span>利用規約</Link></li>
              <li><Link href="#" className="hover:text-orange-400 transition flex items-center gap-2"><span>›</span>プライバシーポリシー</Link></li>
              <li><Link href="#" className="hover:text-orange-400 transition flex items-center gap-2"><span>›</span>特定商取引法に基づく表記</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} AI Counselor Office. All rights reserved.</p>
          <p>Made with ❤️ for Mental Health</p>
        </div>
      </div>
    </footer>
  );
}
