"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useChatStore } from "@/store/chatStore";

const baseNavLinks = [
  { href: "/", label: "ホーム" },
  { href: "/counselor/michele", label: "カウンセラー" },
];
export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, supabase, loading } = useSupabase();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      useChatStore.getState().setMessages([]);
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  const navLinks = session
    ? [...baseNavLinks, { href: "/admin", label: "管理" }]
    : baseNavLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-slate-900">
          <div className="relative h-8 w-40 overflow-hidden">
            <Image
              src="/images/logo/logo_horizontal.png"
              alt="AIカウンセリング事務所"
              fill
              className="object-contain"
              sizes="180px"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={isActive ? "text-slate-900" : "hover:text-slate-900 transition-colors"}
              >
                {link.label}
              </Link>
            );
          })}
          {loading ? null : session ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-full bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-black"
            >
              {isSigningOut ? "..." : "サインアウト"}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-slate-300 px-4 py-2 text-slate-900 transition-colors hover:bg-slate-100"
            >
              ログイン
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-slate-600 hover:text-slate-900"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="メニューを開く"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-16 left-0 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md md:hidden shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col p-4 space-y-4">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                    isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-slate-100">
              {loading ? null : session ? (
                <button
                  type="button"
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isSigningOut}
                  className="w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-white transition-colors hover:bg-black"
                >
                  {isSigningOut ? "サインアウト中..." : "サインアウト"}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-slate-900 transition-colors hover:bg-slate-100"
                >
                  ログイン
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
