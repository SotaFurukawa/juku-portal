// src/app/teacher/layout.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentGroups, isSignedIn } from "@/lib/authGroups";

type NavItem = { label: string; href: string; disabled?: boolean };
type ViewMode = "auto" | "mobile" | "desktop";

function getDisplayName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("sg_username") || "講師";
}
function getIsMdUp() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 768px)").matches; // md
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<ViewMode>("auto");
  const [isMdUp, setIsMdUp] = useState(false);

  // ★追加：権限チェック（teacher配下にstudentsが来たら弾く）
  useEffect(() => {
    (async () => {
      const ok = await isSignedIn();
      if (!ok) {
        router.replace("/login");
        return;
      }
      const groups = await getCurrentGroups();
      if (!groups.includes("teachers")) {
        router.replace("/portal");
      }
    })();
  }, [router]);

  const navItems: NavItem[] = useMemo(
    () => [
      { label: "ポータル", href: "/teacher/portal" },
      { label: "印刷予約一覧", href: "/teacher/print-jobs", disabled: true },
      { label: "通知設定", href: "/teacher/notifications" }, // Bで実装するので先に用意
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
                      drawerOpen ? "opacity-0" : "",
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
            <Link href="/teacher/portal" className="text-base font-extrabold tracking-tight">
              sg-system
            </Link>
          </div>

          {/* right */}
          <div className="flex items-center gap-2">
            <div className="hidden text-sm font-semibold text-zinc-700 md:block">{name}</div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-bold hover:bg-zinc-50"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* ===== Body（ヘッダー分の余白を確保）===== */}
      <div className="pt-14">
        {/* Desktop side */}
        {showDesktopUI && (
          <aside className="fixed left-0 top-14 hidden h-[calc(100vh-56px)] w-64 border-r border-zinc-200 bg-white md:block">
            <div className="p-4">
              <div className="text-sm font-bold text-zinc-600">メニュー</div>
              <nav className="mt-3 space-y-1">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  const disabled = !!item.disabled;
                  return (
                    <Link
                      key={item.href}
                      href={disabled ? "#" : item.href}
                      aria-disabled={disabled}
                      className={[
                        "block rounded-md px-3 py-2 text-sm font-semibold",
                        active ? "bg-sky-50 text-sky-900" : "text-zinc-800 hover:bg-zinc-50",
                        disabled ? "pointer-events-none opacity-40" : "",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* view mode */}
              <div className="mt-6 border-t pt-4">
                <div className="text-xs font-bold text-zinc-600">表示</div>
                <div className="mt-2 flex gap-2">
                  {(["auto", "mobile", "desktop"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={[
                        "rounded-md border px-2 py-1 text-xs font-bold",
                        mode === m ? "border-sky-300 bg-sky-50" : "border-zinc-200 bg-white hover:bg-zinc-50",
                      ].join(" ")}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Mobile drawer */}
        {showMobileUI && (
          <>
            {/* overlay */}
            {drawerOpen && (
              <button
                aria-label="overlay"
                onClick={() => setDrawerOpen(false)}
                className="fixed left-0 top-14 z-40 h-[calc(100vh-56px)] w-full bg-black/30"
              />
            )}

            <aside
              className={[
                "fixed left-0 top-14 z-50 h-[calc(100vh-56px)] w-72 border-r border-zinc-200 bg-white transition-transform duration-200",
                drawerOpen ? "translate-x-0" : "-translate-x-full",
              ].join(" ")}
            >
              <div className="p-4">
                <div className="text-sm font-bold text-zinc-600">メニュー</div>
                <nav className="mt-3 space-y-1">
                  {navItems.map((item) => {
                    const active = pathname === item.href;
                    const disabled = !!item.disabled;
                    return (
                      <Link
                        key={item.href}
                        href={disabled ? "#" : item.href}
                        aria-disabled={disabled}
                        className={[
                          "block rounded-md px-3 py-2 text-sm font-semibold",
                          active ? "bg-sky-50 text-sky-900" : "text-zinc-800 hover:bg-zinc-50",
                          disabled ? "pointer-events-none opacity-40" : "",
                        ].join(" ")}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* view mode */}
                <div className="mt-6 border-t pt-4">
                  <div className="text-xs font-bold text-zinc-600">表示</div>
                  <div className="mt-2 flex gap-2">
                    {(["auto", "mobile", "desktop"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={[
                          "rounded-md border px-2 py-1 text-xs font-bold",
                          mode === m ? "border-sky-300 bg-sky-50" : "border-zinc-200 bg-white hover:bg-zinc-50",
                        ].join(" ")}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Main content */}
        <main className={showDesktopUI ? "ml-64 min-h-[calc(100vh-56px)] p-4" : "min-h-[calc(100vh-56px)] p-4"}>
          {children}
        </main>
      </div>
    </div>
  );
}