// src/lib/api.ts
import { fetchAuthSession } from "aws-amplify/auth";

async function getBearer() {
  const session = await fetchAuthSession();
  // 元HTMLは access_token があれば優先、無ければ id_token でもOKだった
  const access = session.tokens?.accessToken?.toString();
  const id = session.tokens?.idToken?.toString();
  const token = access || id;
  if (!token) throw new Error("Not authenticated (no token)");
  return `Bearer ${token}`;
}

export async function apiGet(pathWithQuery: string) {
  const auth = await getBearer();
  const res = await fetch(`/api/proxy${pathWithQuery}`, {
    method: "GET",
    headers: { Authorization: auth },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`API error ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}
