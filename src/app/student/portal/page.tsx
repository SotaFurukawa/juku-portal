"use client";

import { useMemo } from "react";

export default function StudentPortalPage() {
  // ダミー（後でAPIへ置換）
  const user = useMemo(() => ({ name: "〇〇" }), []);
  const todayTasks = useMemo(
    () => [
      { subject: "英語", topic: "長文（要旨把握）", timeMin: 25, note: "まずは1セット" },
      { subject: "数学", topic: "数列（漸化式）", timeMin: 30, note: "例題→標準" },
      { subject: "物理", topic: "力学（運動方程式）", timeMin: 20, note: "基礎10問" },
    ],
    []
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Greeting */}
      <div className="text-center text-sm font-semibold text-gray-700">
        {user.name}さん、こんにちは！
      </div>

      {/* 今日やること */}
      <SectionTitle title="今日やること" />
      <div className="mt-3 rounded-xl ring-1 ring-gray-200">
        <div className="divide-y">
          {todayTasks.map((t, idx) => (
            <div key={idx} className="flex items-start justify-between gap-4 px-4 py-4">
              <div>
                <div className="font-bold">
                  {t.subject}：{t.topic}
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  {t.note}
                  <span className="mx-2 text-gray-300">/</span>
                  目安 {t.timeMin}分
                </div>
              </div>
              <button className="shrink-0 rounded-md bg-gray-900 px-3 py-2 text-sm font-bold text-white hover:opacity-90">
                開始
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* お知らせ + 講師コメント */}
      <SectionTitle title="お知らせ / 講師コメント" />
      <div className="mt-3 space-y-5 rounded-xl ring-1 ring-gray-200 px-4 py-4">
        <div>
          <div className="text-sm font-bold text-gray-900">お知らせ</div>
          <div className="mt-2 text-sm text-gray-700">
            PortalはWIPです。順次機能を追加します。
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">講師コメント</div>
          <div className="mt-2 text-sm text-gray-700">
            今週は英語の長文を優先。数学は数列を固めよう。
          </div>
        </div>
      </div>

      {/* 学習状況 */}
      <SectionTitle title="学習状況" />
      <div className="mt-3 rounded-xl ring-1 ring-gray-200 px-4 py-4">
        <div className="text-sm font-bold text-gray-900">学習状況のダッシュボード</div>
        <div className="mt-2 text-sm text-gray-700">
          （Coming soon）本実装が完了次第、グラフや詳細指標を表示します。
        </div>

        <div className="mt-4 space-y-4">
          <ProgressBar label="今後の目標の達成率" pct={18} />
          <ProgressBar label="今月の目標の達成率" pct={42} />
        </div>

        <div className="mt-4 rounded-md bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700">
          Coming soon: 教科別の学習量 / 正答率 / 推移グラフ
        </div>
      </div>

      {/* 弱点サマリ */}
      <SectionTitle title="弱点サマリ" />
      <div className="mt-3 rounded-xl ring-1 ring-gray-200 px-4 py-4">
        <div className="text-sm text-gray-700">（Coming soon）模試結果から弱点を自動抽出します。</div>
      </div>

      {/* 次回の予定 */}
      <SectionTitle title="次回の予定" />
      <div className="mt-3 rounded-xl ring-1 ring-gray-200 px-4 py-4">
        <div className="text-sm text-gray-700">（Coming soon）授業・模試・提出期限を表示します。</div>
      </div>

      {/* Ad placeholder */}
      <div className="mt-8 rounded-md bg-yellow-100 px-4 py-4 text-center text-sm font-semibold text-gray-800">
        （ここに小さな広告枠：静止画像など）
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mt-10">
      <div className="text-sm font-bold text-gray-900">{title}</div>
      <div className="mt-2 h-px w-full bg-gray-200" />
    </div>
  );
}

function ProgressBar({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        <div className="text-sm font-bold text-gray-800">{clamped}%</div>
      </div>
      <div className="mt-2 h-6 w-full overflow-hidden rounded-md ring-1 ring-gray-200">
        <div className="h-full bg-sky-800" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
