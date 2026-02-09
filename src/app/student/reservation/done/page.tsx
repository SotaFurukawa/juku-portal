"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ReservationDonePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const count = sp.get("count") || "";

  useEffect(() => {
    const t = setTimeout(() => {
      router.push("/student/reservation");
    }, 1200);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mt-10 rounded-xl ring-1 ring-gray-200 bg-white px-6 py-8 text-center">
        <div className="text-lg font-extrabold text-gray-900">予約が完了しました。</div>
        <div className="mt-2 text-sm font-semibold text-gray-700">
          {count ? `予約件数：${count}件` : ""}
        </div>
        <div className="mt-3 text-sm font-semibold text-gray-600">
          予約システムに戻ります。
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => router.push("/student/reservation")}
            className="h-11 rounded-md bg-sky-800 px-6 text-sm font-bold text-white hover:bg-sky-900"
          >
            予約ページへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}
