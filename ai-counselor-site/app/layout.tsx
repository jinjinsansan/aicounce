import "@/sentry.client.config";
import type { Metadata } from "next";
import { Zen_Maru_Gothic, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import SupabaseProvider from "@/components/providers/SupabaseProvider";
import AppHeader from "@/components/AppHeader";

const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ["latin"],
  variable: "--font-zen-maru",
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  variable: "--font-shippori",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "テープ式心理学 AIカウンセラー",
  description:
    "テープ式心理学に基づく複数のAIカウンセラーと会話できる総合相談プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${zenMaruGothic.variable} ${shipporiMincho.variable} antialiased`}>
        <SupabaseProvider>
          <AppHeader />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
