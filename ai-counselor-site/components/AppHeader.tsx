"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Menu, X } from "lucide-react";
import Image from "next/image";

import { useSupabase } from "@/components/providers/SupabaseProvider";
import { useChatStore } from "@/store/chatStore";

const BASE_PRIMARY_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/#counselors", label: "カウンセラー" },
  { href: "/team", label: "チームケア" },
  { href: "/diary", label: "日記" },
];

const BASE_SERVICE_LINKS = [
  { href: "/account", label: "マイページ" },
  { href: "/login", label: "ログイン / 登録" },
];

const POLICY_LINKS = [
  { href: "/legal/terms", label: "利用規約" },
  { href: "/legal/privacy", label: "プライバシー" },
  { href: "/legal/tokusho", label: "特定商取引法" },
];

const ADMIN_EMAILS = new Set(["goldbenchan@gmail.com"]);

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, supabase, loading } = useSupabase();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const firstNavLinkRef = useRef<HTMLAnchorElement | null>(null);

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

  const isAdmin = session?.user?.email && ADMIN_EMAILS.has(session.user.email);

  const primaryNavItems = useMemo(() => BASE_PRIMARY_LINKS, []);

  const serviceNavItems = useMemo(() => {
    return BASE_SERVICE_LINKS.filter((item) => {
      if (session && item.href === "/login") {
        return false;
      }
      return true;
    });
  }, [session]);

  const legalNavItems = useMemo(() => POLICY_LINKS, []);

  const isLinkActive = (href: string) => {
    const baseHref = href.split("#")[0] || "/";
    if (baseHref === "/") {
      return pathname === "/";
    }
    return pathname === baseHref || pathname?.startsWith(`${baseHref}/`);
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (isMobileMenuOpen) {
      body.style.setProperty("overflow", "hidden");
      body.dataset.menuOpen = "true";
    } else {
      body.style.removeProperty("overflow");
      delete body.dataset.menuOpen;
    }

    return () => {
      body.style.removeProperty("overflow");
      delete body.dataset.menuOpen;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen || !firstNavLinkRef.current) return;
    const node = firstNavLinkRef.current;
    node.focus();
    return () => node?.blur();
  }, [isMobileMenuOpen]);

  const closeMenu = () => setIsMobileMenuOpen(false);
  const toggleMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const overlay =
    typeof document !== "undefined" && isMobileMenuOpen
      ? createPortal(
          <div className="fixed inset-0 z-[14000] md:hidden" role="dialog" aria-modal="true" aria-label="モバイルナビゲーション">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeMenu} />
            <div
              id="mobile-nav-panel"
              className="absolute top-14 right-0 bottom-0 w-[85vw] max-w-md rounded-tl-3xl bg-white shadow-2xl border-l border-slate-100 flex flex-col overflow-hidden transition-transform duration-300 ease-out"
            >
              <div className="relative bg-gradient-to-br from-white via-slate-50 to-slate-100 px-6 pt-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-lg">
                    <Image
                      src="/logo.png"
                      alt="Mental AI Team"
                      fill
                      className="object-contain"
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MENTAL WELLNESS</p>
                    <h2 className="text-2xl font-bold text-slate-900">メンタルAIチーム</h2>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                  24時間寄り添うAIカウンセラーと、複数視点で向き合うチームカウンセリングを一体化したオンラインケア。
                </p>
              </div>

              <div className="flex-1 px-6 py-8 overflow-y-auto">
                <nav className="space-y-8">
                  <div>
                    <h3 className="mb-3 text-xs font-bold tracking-[0.3em] text-slate-400">メイン</h3>
                    <div className="space-y-1">
                      {primaryNavItems.map((item, index) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          ref={index === 0 ? firstNavLinkRef : undefined}
                          onClick={closeMenu}
                          className="group flex items-center rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <span className="group-hover:text-slate-900 transition-colors">{item.label}</span>
                          <span className="ml-auto text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all">→</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-xs font-bold tracking-[0.3em] text-slate-400">サービス</h3>
                    <div className="space-y-1">
                      {serviceNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMenu}
                          className="group flex items-center rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <span className="group-hover:text-slate-900 transition-colors">{item.label}</span>
                          <span className="ml-auto text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all">→</span>
                        </Link>
                      ))}
                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={closeMenu}
                          className="group flex items-center rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <span className="group-hover:text-slate-900 transition-colors">管理者パネル</span>
                          <span className="ml-auto text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all">→</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 text-xs font-bold tracking-[0.3em] text-slate-400">ポリシー</h3>
                    <div className="space-y-1">
                      {legalNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMenu}
                          className="group flex items-center rounded-xl px-3 py-3 text-base font-medium text-slate-600 hover:bg-slate-100"
                        >
                          <span className="group-hover:text-slate-900 transition-colors">{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </nav>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-6 py-6 space-y-3">
                {loading ? null : session ? (
                  <>
                    <Link
                      href="/account"
                      onClick={closeMenu}
                      className="block w-full rounded-2xl bg-slate-900 px-4 py-3 text-center text-base font-semibold text-white shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition"
                    >
                      マイページへ
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        handleSignOut();
                        closeMenu();
                      }}
                      disabled={isSigningOut}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-base font-semibold text-slate-600 hover:bg-white"
                    >
                      <LogOut size={18} />
                      {isSigningOut ? "サインアウト中..." : "サインアウト"}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-base font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    ログイン / 登録
                  </Link>
                )}
                <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} Mental AI Team</p>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl">
              <Image
                src="/logo.png"
                alt="Mental AI Team"
                fill
                className="object-contain"
                sizes="40px"
                priority
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-slate-400">MENTAL CARE</p>
              <p className="text-lg font-bold text-slate-900">メンタルAIチーム</p>
            </div>
          </Link>

          <div className="hidden flex-col gap-1 md:flex">
            <nav className="flex items-center gap-4 text-[13px] font-semibold text-slate-500">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1 transition ${
                    isLinkActive(item.href) ? "bg-slate-900 text-white" : "hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <nav className="flex items-center gap-3 text-xs text-slate-500">
              {serviceNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full border px-3 py-0.5 transition ${
                    isLinkActive(item.href)
                      ? "border-slate-900 text-slate-900"
                      : "border-slate-200 hover:border-slate-900 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`rounded-full px-3 py-0.5 text-xs font-semibold transition ${
                    isLinkActive("/admin") ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  管理
                </Link>
              )}
              <span className="h-3 w-px bg-slate-200" aria-hidden="true" />
              {legalNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs transition ${
                    isLinkActive(item.href) ? "text-slate-900" : "hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              {loading ? null : session ? (
                <>
                  <Link
                    href="/account"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-900 hover:text-slate-900"
                  >
                    マイページ
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="flex items-center gap-1 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                  >
                    <LogOut size={16} />
                    {isSigningOut ? "..." : "サインアウト"}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900"
                >
                  ログイン / 登録
                </Link>
              )}
            </div>

            <button
              type="button"
              className="flex items-center justify-center rounded-full border border-slate-300 p-2 text-slate-600 transition-colors hover:border-slate-900 hover:text-slate-900 md:hidden"
              onClick={toggleMenu}
              aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-panel"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {overlay}
    </>
  );
}
