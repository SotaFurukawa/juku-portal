"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registerSW() {
  return await navigator.serviceWorker.register("/push-sw.js");
}

// ✅ A案：localStorage の sg_id_token をやめて、Amplify Auth から取得
async function getIdTokenOrThrow(): Promise<string> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) throw new Error("ログイン情報（idToken）が取得できません。再ログインしてください。");
  return idToken;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function TeacherNotificationsPage() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const vapidKey = useMemo(() => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "", []);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  // ブラウザの購読状態を確認
  useEffect(() => {
    (async () => {
      if (!supported) return;
      const reg = await registerSW();
      const sub = await reg.pushManager.getSubscription();
      setEnabled(!!sub);
    })();
  }, [supported]);

  const callApi = async (path: string, body?: any) => {
    if (!API_BASE) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です。");

    // ✅ ここが変更点：sg_id_token ではなく Amplify Auth から取る
    const idToken = await getIdTokenOrThrow();

    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: body ? JSON.stringify(body) : "{}",
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`API Error: ${res.status} ${t}`);
    }
    return res.json().catch(() => ({}));
  };

  const enablePush = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (!supported) throw new Error("このブラウザは通知に対応していません。");
      if (!vapidKey) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY が未設定です。");

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") throw new Error("通知が許可されませんでした。");

      const reg = await registerSW();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(vapidKey),
      });

      await callApi("/notify/subscribe", sub);
      setEnabled(true);
      setMsg("通知をONにしました。");
    } catch (e: any) {
      setMsg(String(e?.message ?? e ?? "失敗しました。"));
    } finally {
      setBusy(false);
    }
  };

  const disablePush = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await registerSW();
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await callApi("/notify/disable");
      setEnabled(false);
      setMsg("通知をOFFにしました。");
    } catch (e: any) {
      setMsg(String(e?.message ?? e ?? "失敗しました。"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-sm font-bold text-gray-900">通知設定</div>

      <div className="mt-3 rounded-xl ring-1 ring-gray-200 bg-white px-4 py-4 text-sm text-gray-800">
        <div className="font-bold">講師向け通知</div>
        <div className="mt-2 text-gray-700">
          印刷予約が送信されたときに「〇〇さんが◯件の印刷予約を送信しました」と通知します。
        </div>

        {!supported && (
          <div className="mt-3 text-gray-600">
            このブラウザは通知に対応していません。推奨：Chrome / Edge
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-800">
            状態：{enabled ? "ON" : "OFF"}（権限：{permission}）
          </div>

          {!enabled ? (
            <button
              disabled={busy || !supported}
              onClick={enablePush}
              className="rounded-md bg-sky-800 px-4 py-2 text-sm font-bold text-white hover:bg-sky-900 disabled:opacity-60"
            >
              {busy ? "処理中..." : "通知をON"}
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={disablePush}
              className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
            >
              {busy ? "処理中..." : "通知をOFF"}
            </button>
          )}
        </div>

        {msg && (
          <div className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}