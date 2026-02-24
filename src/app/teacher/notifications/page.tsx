// src/app/teacher/notifications/page.tsx
export default function TeacherNotificationsPage() {
  return (
    <div className="space-y-3">
      <div className="text-lg font-extrabold">通知設定</div>

      <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
        ここに「通知のON/OFF」「通知の許可」「テスト通知」などを追加します。
        <div className="mt-2 text-zinc-500">
          ※ 次のステップ（B）でWeb Pushの実装に入ります。
        </div>
      </div>
    </div>
  );
}