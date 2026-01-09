import "@/sentry.client.config";
import type { Metadata } from "next";
import "./globals.css";
import SupabaseProvider from "@/components/providers/SupabaseProvider";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "メンタルAIチーム | もう、誰にも気を使わなくていい",
  description:
    "人間が一切介在しない、AIだけのカウンセリング事務所。10人のプロフェッショナルAIカウンセラーが、あなたの心の声を優しく聴きます。",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "メンタルAIチーム",
    description:
      "人間が一切介在しない、AIだけのカウンセリング事務所。10人のプロフェッショナルAIカウンセラーが、あなたの心の声を優しく聴きます。",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "メンタルAIチーム",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "メンタルAIチーム",
    description:
      "人間が一切介在しない、AIだけのカウンセリング事務所。10人のプロフェッショナルAIカウンセラーが、あなたの心の声を優しく聴きます。",
    images: ["/logo.png"],
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
