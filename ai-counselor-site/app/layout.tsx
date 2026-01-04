import "@/sentry.client.config";
import type { Metadata } from "next";
import "./globals.css";
import SupabaseProvider from "@/components/providers/SupabaseProvider";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "AIカウンセリング事務所 | もう、誰にも気を使わなくていい",
  description:
    "人間が一切介在しない、AIだけのカウンセリング事務所。10人のプロフェッショナルAIカウンセラーが、あなたの心の声を優しく聴きます。",
  icons: {
    icon: "/images/logo/logo_square.png",
    apple: "/images/logo/logo_square.png",
  },
  openGraph: {
    title: "AIカウンセリング事務所",
    description:
      "人間が一切介在しない、AIだけのカウンセリング事務所。10人のプロフェッショナルAIカウンセラーが、あなたの心の声を優しく聴きます。",
    images: ["/images/logo/logo_square.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AIカウンセリング事務所",
    description:
      "人間が一切介在しない、AIだけのカウンセリング事務所。10人のプロフェッショナルAIカウンセラーが、あなたの心の声を優しく聴きます。",
    images: ["/images/logo/logo_square.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <SupabaseProvider>
          <AppHeader />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
