"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DoneClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // 任意：クエリに message があれば表示に使う
  const message = sp.get("message") || "予約が完了しました。予約システムに戻ります。";
  const backTo = sp.get("backTo") || "/student/reservation";

  useEffect(() => {
    const t = setTimeout(() => {
      router.push(backTo);
    }, 1500);

    return () => clearTimeout(t);
  }, [router, backTo]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-tight">sg-system</div>
            <div />
          </div>

          <div className="mt-6 border-b pb-3">
            <div className="flex items-end gap-4">
              <div className="text-base font-semibold">印刷予約</div>
              <div className="text-base font-semibold text-gray-500">完了</div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pb-10">
        <div className="mx-auto max-w-xl">
          <div className="mt-10 rounded-xl bg-gray-50 px-5 py-6">
            <div className="text-base font-bold text-gray-900">{message}</div>
            <div className="mt-2 text-sm font-semibold text-gray-600">
              自動で戻らない場合は、下のボタンを押してください。
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push(backTo)}
                className="w-full rounded-md bg-sky-800 px-4 py-3 text-sm font-bold text-white hover:bg-sky-900"
              >
                予約システムに戻る
              </button>
            </div>
          </div>
        </div>
      </main>

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
