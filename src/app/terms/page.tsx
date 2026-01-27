export const metadata = {
  title: "利用規約 | sg-system",
  description: "sg-system 利用規約",
};

export default function TermsPage() {
  const updatedAt = "2026年1月XX日"; // ★日付だけ直してOK
  const contact = "XXXX（メールアドレス等）"; // ★ここだけ差し替え

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header (loginと同トーン) */}
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
              <div className="text-base font-semibold text-gray-500">利用規約</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 pb-10">
        <div className="mx-auto max-w-xl">
          <div className="mt-8 space-y-6">
            <h1 className="text-lg font-extrabold">sg-system 利用規約</h1>
            <div className="text-sm font-semibold text-gray-600">最終更新日：{updatedAt}</div>

            <Section title="1. 適用">
              本規約は、sg-system（以下「本サービス」）の利用条件を定めるものです。利用者は、本規約に同意のうえ本サービスを利用するものとします。
            </Section>

            <Section title="2. 本サービスの内容">
              本サービスは、学習支援・印刷予約に関する機能（ログイン、学習情報表示、過去問メタデータの閲覧、予約等）を提供します。
              <br />
              本サービスで扱う教材等は、運営者が管理する環境で利用されることがあります（※配布を目的としません）。
            </Section>

            <Section title="3. アカウント">
              利用者は、自己の責任でログイン情報を管理するものとします。ログイン情報の不正利用により生じた損害について、運営者は運営者の故意または重過失がある場合を除き責任を負いません。
            </Section>

            <Section title="4. 禁止事項">
              利用者は、以下の行為をしてはなりません。
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-800">
                <li>法令または公序良俗に反する行為</li>
                <li>本サービスの運営を妨げる行為、過度な負荷をかける行為</li>
                <li>不正アクセス、脆弱性探索、リバースエンジニアリング等</li>
                <li>他者の権利（著作権等）を侵害する行為</li>
                <li>虚偽の情報を登録・送信する行為</li>
              </ul>
            </Section>

            <Section title="5. 免責">
              運営者は、本サービスの完全性・正確性・有用性等を保証しません。
              <br />
              本サービスの利用により利用者に生じた損害について、運営者は運営者の故意または重過失がある場合を除き責任を負いません。
            </Section>

            <Section title="6. サービスの変更・停止">
              運営者は、利用者への事前通知なく、本サービスの内容変更、提供の停止または終了を行うことがあります。
            </Section>

            <Section title="7. 規約の変更">
              運営者は、必要に応じて本規約を変更できます。変更後に本サービスを利用した場合、利用者は変更後の規約に同意したものとします。
            </Section>

            <Section title="8. 準拠法・管轄">
              本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、（運営者の所在地を管轄する）裁判所を第一審の専属的合意管轄裁判所とします。
            </Section>

            <Section title="9. お問い合わせ">
              本サービスに関する問い合わせは、以下までご連絡ください。
              <div className="mt-2 text-sm font-semibold text-gray-900">{contact}</div>
            </Section>

            <div className="pt-4">
              <a href="/" className="text-sm font-semibold text-gray-700 hover:underline">
                &gt; トップへ戻る
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (loginと同トーン) */}
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
