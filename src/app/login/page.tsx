"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "aws-amplify/auth";
import AdsenseUnit from "@/components/AdsenseUnit";

export default function LoginPage() {
  const router = useRouter();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const u = loginId.trim();
    const p = password;

    if (!u || !p) {
      setMsg("ログインIDとパスワードを入力してください。");
      return;
    }

    setBusy(true);
    try {
      await signIn({ username: u, password: p });
      router.push("/student/portal");
    } catch (err: any) {
      const m = String(err?.message ?? err ?? "");
      const low = m.toLowerCase();
      if (low.includes("not authorized") || low.includes("incorrect username or password")) {
        setMsg("ログインIDまたはパスワードが違います。");
      } else if (low.includes("user does not exist")) {
        setMsg("ユーザーが見つかりません。新規登録（申請）をしてください。");
      } else if (low.includes("password reset required")) {
        setMsg("パスワードの再設定が必要です。");
      } else {
        setMsg(m || "ログインに失敗しました。");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top bar (簡易ヘッダー) */}
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight">sg-system</div>
            <div /> {/* 右上は空にして整列だけ維持 */}
          </div>

          <div className="mt-6 border-b pb-3">
            <div className="flex items-end gap-4">
              <div className="text-base font-semibold">マイページ</div>
              <div className="text-base font-semibold text-gray-500">ログイン</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 pb-10">
        <div className="mx-auto max-w-xl">
          <form onSubmit={onSubmit} className="mt-8">
            {/* Login ID */}
            <div>
              <label className="block text-sm font-semibold">ログインID（メールアドレス）</label>
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="mt-2 w-full rounded-md bg-gray-50 px-3 py-3 text-sm outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-sky-300"
                placeholder="example@example.com"
                autoComplete="username"
                inputMode="email"
              />
            </div>

            {/* Password */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold">パスワード</label>
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="text-sm font-semibold text-gray-600 hover:underline"
                >
                  {showPw ? "非表示" : "パスワードを表示"}
                </button>
              </div>

              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-md bg-gray-50 px-3 py-3 text-sm outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-sky-300"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Error message */}
            {msg && (
              <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                {msg}
              </div>
            )}

            {/* Login button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-sky-800 px-4 py-3 text-sm font-bold text-white hover:bg-sky-900 disabled:opacity-60"
              >
                {busy ? "ログイン中..." : "ログイン"}
              </button>
            </div>

            {/* Forgot links */}
            <div className="mt-5 space-y-2 text-sm">
              <a href="/help/forgot-id" className="block text-gray-700 hover:underline">
                &gt; ログインIDをお忘れの方
              </a>
              <a href="/help/forgot-password" className="block text-gray-700 hover:underline">
                &gt; パスワードをお忘れの方
              </a>
            </div>

            {/* Signup big button */}
            <div className="mt-10 border-t pt-6">
              <a
                href="/signup"
                className="block w-full rounded-md bg-yellow-300 px-4 py-3 text-center text-sm font-extrabold text-gray-900 hover:bg-yellow-200"
              >
                新規会員登録はこちら
              </a>

              {/* Recommended environment */}
              <div className="mt-8">
                <div className="text-sm font-bold">推奨環境</div>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <div>パソコン　Microsoft Edge / Google Chrome</div>
                  <div>スマートフォン　iOS Safari / Android Chrome</div>
                </div>
              </div>

              {/* Ad placeholder */}
                {/* AdSense */}
                <AdsenseUnit
                slot="9505393881"
                className="mt-7 rounded-md bg-yellow-100 px-2 py-2"
                />
            </div>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 bg-sky-900 px-4 py-10 text-white">
        <div className="mx-auto max-w-xl">
          <div className="space-y-2 text-sm font-semibold">
            <a href="/terms" className="block hover:underline">
              &gt; 利用規約
            </a>
            <a href="/privacy" className="block hover:underline">
              &gt; プライバシーポリシー
            </a>
          </div>

          <div className="mt-10 text-right text-xs font-semibold opacity-90">
            Copyright&nbsp;Furukawa
          </div>
        </div>
      </footer>
    </div>
  );
}
