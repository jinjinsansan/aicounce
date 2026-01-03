import "@/sentry.client.config";
import type { Metadata } from "next";
import "./globals.css";
import SupabaseProvider from "@/components/providers/SupabaseProvider";
import AppHeader from "@/components/AppHeader";

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
      <body className="antialiased">
        <SupabaseProvider>
          <AppHeader />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
