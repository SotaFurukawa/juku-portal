"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavItem = { label: string; href: string; disabled?: boolean };
type ViewMode = "auto" | "mobile" | "desktop";

function getDisplayName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("sg_username") || "生徒";
}
function getIsMdUp() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 768px)").matches; // md
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<ViewMode>("auto");
  const [isMdUp, setIsMdUp] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "ポータル", href: "/student/portal" },
      { label: "予約", href: "/student/reservation" },
      { label: "単元別演習", href: "/student/genre_exercise", disabled: true },
      { label: "学習履歴", href: "/student/history", disabled: true },
    ],
    [],
  );

  useEffect(() => setName(getDisplayName()), []);

  // modeをlocalStorageで保持
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("sg_view_mode") as ViewMode | null;
    if (saved === "auto" || saved === "mobile" || saved === "desktop") setMode(saved);
    else setMode("auto");
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("sg_view_mode", mode);
  }, [mode]);

  // 画面幅監視
  useEffect(() => {
    setIsMdUp(getIsMdUp());
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsMdUp(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // 画面遷移したら閉じる
  useEffect(() => setDrawerOpen(false), [pathname]);

  // ESCで閉じる
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sg_id_token");
      localStorage.removeItem("sg_access_token");
      localStorage.removeItem("sg_refresh_token");
      localStorage.removeItem("sg_username");
      localStorage.removeItem("sg_groups");
    }
    router.push("/");
  };

  const effectiveUI: "mobile" | "desktop" = (() => {
    if (mode === "mobile") return "mobile";
    if (mode === "desktop") return "desktop";
    return isMdUp ? "desktop" : "mobile";
  })();

  const showMobileUI = effectiveUI === "mobile";
  const showDesktopUI = effectiveUI === "desktop";

  return (
    <div className="h-screen bg-zinc-50 text-zinc-900">
      {/* ===== Header：絶対固定（常に表示）===== */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-zinc-200 bg-white">
        <div className="flex h-14 w-full items-center justify-between px-4">
          {/* left */}
          <div className="flex items-center gap-3">
            {showMobileUI && (
              <button
                type="button"
                aria-label="メニュー"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen((v) => !v)}
                className="shrink-0"
              >
                <div className="relative h-10 w-10 select-none">
                  <span
                    className={[
                      "absolute left-1/2 top-[12px] h-[2px] w-[20px] -translate-x-1/2 rounded-full bg-zinc-900 transition-all duration-200",
                      drawerOpen ? "top-[19px] rotate-45" : "",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "absolute left-1/2 top-[19px] h-[2px] w-[20px] -translate-x-1/2 rounded-full bg-zinc-900 transition-all duration-200",
                      drawerOpen ? "opacity-0" : "opacity-100",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "absolute left-1/2 top-[26px] h-[2px] w-[20px] -translate-x-1/2 rounded-full bg-zinc-900 transition-all duration-200",
                      drawerOpen ? "top-[19px] -rotate-45" : "",
                    ].join(" ")}
                  />
                </div>
              </button>
            )}

            <div className="ml-1 whitespace-nowrap text-xl font-black tracking-tight md:text-2xl">
              sg-system
            </div>
          </div>

          {/* right */}
          <div className="flex items-center gap-3">
            <div className="hidden text-sm font-semibold text-zinc-600 sm:block">
              {name ? `${name}さん` : ""}
            </div>
            <div className="h-6 w-px bg-zinc-300" />
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-bold text-zinc-700 hover:text-zinc-900"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* ===== Header分の余白（ここから下がスクロール領域）===== */}
      <div className="pt-14">
        {/* ここは sidebar / main のみ：ヘッダーとは独立 */}
        <div className="flex h-[calc(100vh-56px)] w-full">
          {/* PC Sidebar：左端に張り付く & 独立スクロール */}
          {showDesktopUI && (
            <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white">
              <div className="h-[calc(100vh-56px)] overflow-y-auto p-4">
                <div className="mb-3 text-xs font-black tracking-wider text-zinc-500">
                  クイック導線
                </div>
                <ul className="space-y-1">
                  {navItems.map((it) => {
                    const active = pathname === it.href;
                    const base = "block rounded-lg px-3 py-2 text-sm font-bold";
                    const cls = it.disabled
                      ? `${base} cursor-not-allowed text-zinc-400`
                      : active
                        ? `${base} bg-zinc-900 text-white`
                        : `${base} text-zinc-800 hover:bg-zinc-100`;

                    return (
                      <li key={it.href}>
                        {it.disabled ? (
                          <div className={cls}>
                            {it.label}
                            <span className="ml-2 text-xs font-black text-zinc-400">
                              coming soon
                            </span>
                          </div>
                        ) : (
                          <Link className={cls} href={it.href}>
                            {it.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          )}

          {/* Main：独立スクロール */}
          <div className="min-w-0 flex-1">
            <div className="h-[calc(100vh-56px)] overflow-y-auto">
              <main className="p-4 md:p-6">
                {children}

                {/* ページ内フッター（ログイン画面下部っぽい位置） */}
                <footer className="mt-12 border-t border-zinc-200 pt-6 pb-10">
                  <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 px-4">
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-zinc-600">
                      <a className="hover:text-zinc-900" href="#" onClick={(e) => e.preventDefault()}>
                        プライバシーポリシー
                      </a>
                      <span className="text-zinc-300">|</span>
                      <a className="hover:text-zinc-900" href="#" onClick={(e) => e.preventDefault()}>
                        利用規約
                      </a>
                      <span className="text-zinc-300">|</span>
                      <a className="hover:text-zinc-900" href="#" onClick={(e) => e.preventDefault()}>
                        お問い合わせ
                      </a>
                    </div>

                    {/* PC/スマホ切替（フッター中央） */}
                    <div className="flex items-center overflow-hidden rounded-full border border-zinc-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setMode("auto")}
                        className={[
                          "px-4 py-2 text-xs font-black",
                          mode === "auto"
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-700 hover:bg-zinc-100",
                        ].join(" ")}
                      >
                        自動
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("mobile")}
                        className={[
                          "px-4 py-2 text-xs font-black",
                          mode === "mobile"
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-700 hover:bg-zinc-100",
                        ].join(" ")}
                      >
                        スマホ
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("desktop")}
                        className={[
                          "px-4 py-2 text-xs font-black",
                          mode === "desktop"
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-700 hover:bg-zinc-100",
                        ].join(" ")}
                      >
                        PC
                      </button>
                    </div>

                    {/* 現在表示 */}
                    <div className="text-xs font-bold text-zinc-600">
                      表示：{" "}
                      <span className="text-zinc-900">
                        {effectiveUI === "desktop" ? "PC" : "スマホ"}
                      </span>
                      <span className="mx-2 text-zinc-300">|</span>
                      モード： <span className="text-zinc-900">{mode}</span>
                    </div>
                  </div>
                </footer>
              </main>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Mobile Drawer（ヘッダーとは独立）===== */}
      {showMobileUI && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            className={[
              "fixed inset-0 z-40 bg-black/25 transition-opacity",
              drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
            ].join(" ")}
          />

          <aside
            className={[
              "fixed left-0 top-14 z-50 h-[calc(100vh-56px)] w-[82vw] max-w-xs bg-white shadow-lg transition-transform duration-200",
              drawerOpen ? "translate-x-0" : "-translate-x-full",
            ].join(" ")}
          >
            <div className="h-full overflow-y-auto p-4">
              <div className="mb-3 text-xs font-black tracking-wider text-zinc-500">
                クイック導線
              </div>
              <ul className="space-y-1">
                {navItems.map((it) => {
                  const active = pathname === it.href;
                  const base = "block rounded-lg px-3 py-2 text-sm font-bold";
                  const cls = it.disabled
                    ? `${base} cursor-not-allowed text-zinc-400`
                    : active
                      ? `${base} bg-zinc-900 text-white`
                      : `${base} text-zinc-800 hover:bg-zinc-100`;

                  return (
                    <li key={it.href}>
                      {it.disabled ? (
                        <div className={cls}>
                          {it.label}
                          <span className="ml-2 text-xs font-black text-zinc-400">
                            coming soon
                          </span>
                        </div>
                      ) : (
                        <Link className={cls} href={it.href}>
                          {it.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
