import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative w-full bg-slate-900 text-white">
      <div className="relative w-full aspect-[4/1] md:aspect-[6/1] lg:aspect-[8/1]">
        <Image
          src="/images/footer.png"
          alt="Footer Background"
          fill
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-white/10">
                <Image
                  src="/images/logo_square.png"
                  alt="Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-bold">AIカウンセリング事務所</span>
            </div>
            <p className="text-slate-400 text-sm">
              24時間365日、あなたの心に寄り添うAIパートナー。<br />
              人間不在の安心感と、専門知の信頼性をあなたに。
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-slate-200">リンク</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/" className="hover:text-white transition">ホーム</Link></li>
              <li><Link href="/#counselors" className="hover:text-white transition">カウンセラー一覧</Link></li>
              <li><Link href="/#about" className="hover:text-white transition">事務所について</Link></li>
              <li><Link href="/login" className="hover:text-white transition">ログイン / 登録</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-slate-200">法的事項</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="#" className="hover:text-white transition">利用規約</Link></li>
              <li><Link href="#" className="hover:text-white transition">プライバシーポリシー</Link></li>
              <li><Link href="#" className="hover:text-white transition">特定商取引法に基づく表記</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} AI Counselor Office. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
