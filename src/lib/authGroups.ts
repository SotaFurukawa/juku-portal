// src/lib/authGroups.ts
import { fetchAuthSession } from "aws-amplify/auth";

/** CognitoのIDトークン(JWT)から groups を取り出す */
export function getGroupsFromIdToken(idToken?: string): string[] {
  if (!idToken) return [];
  try {
    const payload = JSON.parse(atob(idToken.split(".")[1]));
    const groups = payload["cognito:groups"] ?? [];
    return Array.isArray(groups) ? groups : [];
  } catch {
    return [];
  }
}

/** 現在のセッションから groups を取得（未ログインなら []） */
export async function getCurrentGroups(): Promise<string[]> {
  try {
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken?.toString();
    const groups = getGroupsFromIdToken(idToken);

    // 既存コードが localStorage を使っているので、同期用に保存しておく（任意）
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sg_groups", JSON.stringify(groups));
    }
    return groups;
  } catch {
    return [];
  }
}

/** ざっくり「ログインしてるか」チェック（未ログインなら false） */
export async function isSignedIn(): Promise<boolean> {
  try {
    const session = await fetchAuthSession();
    return !!session.tokens?.idToken;
  } catch {
    return false;
  }
}