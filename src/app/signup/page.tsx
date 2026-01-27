"use client";

import { useState } from "react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [grade, setGrade] = useState("");

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const submit = async () => {
    setResult(null);

    const n = name.trim();
    const e = email.trim();

    if (!n || !e || !grade) {
      setResult({ kind: "err", msg: "全て入力してください。" });
      return;
    }
    if (!isValidEmail(e)) {
      setResult({ kind: "err", msg: "メールアドレスの形式が正しくありません。" });
      return;
    }

    // 旧 signup.html に合わせて、同義キーも一緒に送る（バックエンド実装差異に強くする）
    const payload = {
      // primary
      name: n,
      email: e,
      grade,

      // aliases (念のため)
      user_name: n,
      mail: e,
      mail_address: e,
      grade_name: grade,

      kind: "student",
      request_type: "signup_request",
      submitted_at: new Date().toISOString(),
    };

    setBusy(true);
    try {
      // ※ 後で 3) で Next.js 側に /api/signup-requests を作ってつなぐ想定
      const res = await fetch("/api/signup-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");

      if (!res.ok) {
        setResult({
          kind: "err",
          msg: `申請に失敗しました（${res.status}）\n${text || "サーバーがリクエストを受理しませんでした。"}`,
        });
        return;
      }

      setResult({ kind: "ok", msg: "登録申請を受け付けました。承認までお待ちください。" });
      setName("");
      setEmail("");
      setGrade("");
    } catch (e: any) {
      setResult({ kind: "err", msg: String(e?.message ?? e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight">sg-system</div>
            <div />
          </div>

          <div className="mt-6 border-b pb-3">
            <div className="flex items-end gap-4">
              <div className="text-base font-semibold">マイページ</div>
              <div className="text-base font-semibold text-gray-500">登録申請</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 pb-10">
        <div className="mx-auto max-w-xl">
          <div className="mt-8">
            <h1 className="text-lg font-extrabold">登録申請（承認制）</h1>
            <p className="mt-2 text-sm text-gray-700">
              まずは申請を送ってください。承認後、ログインして利用開始となります。
            </p>

            <div className="mt-5 rounded-md bg-gray-50 px-4 py-4 text-sm text-gray-800">
              <div className="font-extrabold">登録の流れ</div>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>
                  <span className="font-bold">このページで登録申請</span>を送信
                </li>
                <li>承認されたら利用開始</li>
              </ol>
              <div className="mt-2 text-xs text-gray-600">
                ※ 申請が承認されるまで、利用できない場合があります。
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold">氏名</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-md bg-gray-50 px-3 py-3 text-sm outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-sky-300"
                  placeholder="例）山田 太郎"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold">メールアドレス</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-md bg-gray-50 px-3 py-3 text-sm outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-sky-300"
                  placeholder="example@example.com"
                  autoComplete="email"
                  inputMode="email"
                />
                <div className="mt-2 text-xs text-gray-600">※ 承認連絡・ログインに使用します。</div>
              </div>

              <div>
                <label className="block text-sm font-semibold">学年</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="mt-2 w-full rounded-md bg-gray-50 px-3 py-3 text-sm outline-none ring-1 ring-gray-200 focus:bg-white focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">選択してください</option>
                  <option value="中1">中1</option>
                  <option value="中2">中2</option>
                  <option value="中3">中3</option>
                  <option value="高1">高1</option>
                  <option value="高2">高2</option>
                  <option value="高3">高3</option>
                  <option value="既卒">既卒</option>
                </select>
              </div>

              <div className="mt-2 grid gap-2">
                <button
                    onClick={submit}
                    disabled={busy}
                    className="w-full rounded-md bg-yellow-300 px-4 py-3 text-sm font-extrabold text-gray-900 hover:bg-yellow-200 disabled:opacity-60"
                >
                    {busy ? "送信中..." : "登録申請する"}
                </button>

                <a
                    href="/login"
                    className="block w-full rounded-md bg-sky-800 px-4 py-3 text-center text-sm font-bold text-white hover:bg-sky-900"
                    >
                    ログインへ戻る
                </a>

              </div>

              {result && (
                <div
                  className={`whitespace-pre-wrap rounded-md px-3 py-2 text-sm ${
                    result.kind === "ok"
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  {result.msg}
                </div>
              )}
            </div>

            <div className="mt-10">
              <div className="text-sm font-bold">推奨環境</div>
              <div className="mt-2 space-y-1 text-sm text-gray-700">
                <div>パソコン　Microsoft Edge / Google Chrome</div>
                <div>スマートフォン　iOS Safari / Android Chrome</div>
              </div>
            </div>
          </div>
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
