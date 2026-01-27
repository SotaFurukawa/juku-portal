export const metadata = {
  title: "プライバシーポリシー | sg-system",
  description: "sg-system プライバシーポリシー",
};

export default function PrivacyPage() {
  const updatedAt = "2026年1月XX日"; // ★日付だけ直してOK
  const contact = "XXXX（メールアドレス等）"; // ★ここだけ差し替え

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="px-4 pt-6">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold tracking-tight">
              sg-system
            </a>
            <div />
          </div>

          <div className="mt-6 border-b pb-3">
            <div className="flex items-end gap-4">
              <div className="text-base font-semibold">マイページ</div>
              <div className="text-base font-semibold text-gray-500">プライバシーポリシー</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 pb-10">
        <div className="mx-auto max-w-xl">
          <div className="mt-8 space-y-6">
            <h1 className="text-lg font-extrabold">sg-system プライバシーポリシー</h1>
            <div className="text-sm font-semibold text-gray-600">最終更新日：{updatedAt}</div>

            <Section title="1. 取得する情報">
              本サービスは、以下の情報を取得する場合があります。
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-800">
                <li>アカウント情報（ログインID等）</li>
                <li>予約・学習に関する入力情報（例：氏名、学年、選択した過去問メタデータ等）</li>
                <li>利用状況（アクセス日時、端末情報、ログ等）</li>
                <li>Cookie 等の識別子（広告配信・アクセス解析等のため）</li>
              </ul>
            </Section>

            <Section title="2. 利用目的">
              取得した情報は、以下の目的で利用します。
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-800">
                <li>本サービスの提供・本人確認・不正利用防止</li>
                <li>予約処理、学習情報の表示等の機能提供</li>
                <li>問い合わせ対応</li>
                <li>サービス改善、品質向上、障害対応</li>
                <li>広告配信・効果測定（Google AdSense 利用時）</li>
              </ul>
            </Section>

            <Section title="3. 第三者提供">
              運営者は、法令に基づく場合等を除き、本人の同意なく個人情報を第三者に提供しません。
            </Section>

            <Section title="4. 外部サービスの利用（広告）">
              本サービスは、第三者配信の広告サービス（Google AdSense）を利用する場合があります。
              <br />
              Google などの第三者が Cookie 等を使用し、利用者のアクセス情報に基づいて広告を配信することがあります。利用者は、ブラウザ設定等により Cookie を無効化できます。
            </Section>

            <Section title="5. 安全管理">
              取得した情報について、漏えい・滅失・毀損の防止等のため、合理的な安全管理措置を講じます。
            </Section>

            <Section title="6. 開示・訂正・削除等">
              利用者から、本人の情報に関する開示・訂正・削除等の申し出があった場合、本人確認のうえ、合理的な範囲で対応します。
            </Section>

            <Section title="7. お問い合わせ窓口">
              本ポリシーに関する問い合わせは、以下までご連絡ください。
              <div className="mt-2 text-sm font-semibold text-gray-900">{contact}</div>
            </Section>

            <Section title="8. 改定">
              本ポリシーは、必要に応じて改定することがあります。改定後の内容は本サービス上で掲示します。
            </Section>

            <div className="pt-4">
              <a href="/" className="text-sm font-semibold text-gray-700 hover:underline">
                &gt; トップへ戻る
              </a>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-sm font-extrabold text-gray-900">{title}</div>
      <div className="mt-2 text-sm leading-7 text-gray-800">{children}</div>
    </section>
  );
}
