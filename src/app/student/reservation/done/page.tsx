import { Suspense } from "react";
import DoneClient from "./DoneClient";

export default function DonePage() {
  return (
    <Suspense fallback={<DoneSkeleton />}>
      <DoneClient />
    </Suspense>
  );
}

function DoneSkeleton() {
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
            <div className="text-base font-bold text-gray-900">処理中...</div>
            <div className="mt-2 text-sm font-semibold text-gray-600">
              画面を準備しています。
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
