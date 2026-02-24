// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

function getApiBase(): string {
  // 既存と同じ優先順位（ただし「実行時に評価」）
  const base =
    process.env.API_BASE_URL ||
    process.env.API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE ||
    "";
  return base.trim();
}

function normalizeBaseForLog(base: string): string {
  // ログに出すのは危険なので、末尾だけ分かる形にマスク（存在確認用）
  if (!base) return "";
  try {
    const u = new URL(base);
    return `${u.protocol}//${u.host}/...`;
  } catch {
    // URLとして解釈できない場合は長さだけ
    return `len=${base.length}`;
  }
}

function normalizeParams(params: any): Promise<{ path?: string[] }> {
  // Next のバージョンによって params が Promise の場合があるので吸収する
  if (params && typeof params.then === "function") return params;
  return Promise.resolve(params ?? {});
}

async function handler(req: NextRequest, ctx: { params: any }) {
  // ★デバッグヘッダ（本番反映確認用）: 好きな文字列にしてOK
  const DEBUG_TAG = "proxy-debug-2026-02-24-b";

  try {
    const API_BASE = getApiBase();

    // ★ログ（CloudWatchに出ればラッキー）
    console.log("[proxy] called", {
      method: req.method,
      path: req.nextUrl.pathname,
      search: req.nextUrl.search,
      apiBasePresent: Boolean(API_BASE),
      apiBaseMasked: normalizeBaseForLog(API_BASE),
    });

    if (!API_BASE) {
      // ★ Networkで確実に確認できるようにヘッダも付ける
      return NextResponse.json(
        { message: "Proxy misconfigured: API_BASE_URL (or API_BASE) is missing" },
        {
          status: 500,
          headers: {
            "X-Proxy-Debug": DEBUG_TAG,
            "X-Proxy-Stage": "missing_api_base",
          },
        }
      );
    }

    const resolved = await normalizeParams(ctx.params);
    const pathArr: string[] | undefined = resolved?.path;

    if (!pathArr || pathArr.length === 0) {
      return NextResponse.json(
        { message: "Missing path (e.g. /api/proxy/exams/meta)" },
        {
          status: 400,
          headers: {
            "X-Proxy-Debug": DEBUG_TAG,
            "X-Proxy-Stage": "missing_path",
          },
        }
      );
    }

    // パス組み立て
    const upstreamPath = pathArr.map(encodeURIComponent).join("/");
    const upstreamUrl = new URL(`${API_BASE.replace(/\/$/, "")}/${upstreamPath}`);

    // ✅ クエリをそのまま転送
    req.nextUrl.searchParams.forEach((v, k) => upstreamUrl.searchParams.append(k, v));

    // ✅ Authorization を転送
    const auth = req.headers.get("authorization") || "";

    // body（GET/HEAD以外）
    const method = req.method.toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(method);
    const body = hasBody ? await req.arrayBuffer() : undefined;

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method,
      headers: {
        ...(req.headers.get("content-type")
          ? { "content-type": req.headers.get("content-type")! }
          : {}),
        ...(auth ? { Authorization: auth } : {}),
      },
      body,
      cache: "no-store",
    });

    const buf = await upstreamRes.arrayBuffer();
    const outHeaders = new Headers();

    const ct = upstreamRes.headers.get("content-type");
    if (ct) outHeaders.set("content-type", ct);

    // ★ デバッグヘッダ（Networkから追えるように）
    outHeaders.set("X-Proxy-Debug", DEBUG_TAG);
    outHeaders.set("X-Proxy-Stage", "upstream_returned");
    outHeaders.set("X-Proxy-Upstream-Status", String(upstreamRes.status));
    // URL全部は出さない（hostだけ）
    outHeaders.set("X-Proxy-Upstream-Host", upstreamUrl.host);

    // upstreamエラー時はログも残す（本文は長い/機密の可能性あるので載せない）
    if (!upstreamRes.ok) {
      console.error("[proxy] upstream not ok", {
        status: upstreamRes.status,
        upstreamHost: upstreamUrl.host,
        upstreamPath: upstreamUrl.pathname,
      });
    }

    return new NextResponse(buf, { status: upstreamRes.status, headers: outHeaders });
  } catch (e: any) {
    console.error("[proxy] crashed", e?.message || e, e?.stack);
    return NextResponse.json(
      { message: "Proxy crashed", error: String(e?.message || e) },
      {
        status: 500,
        headers: {
          "X-Proxy-Debug": "proxy-debug-2026-02-24-b",
          "X-Proxy-Stage": "exception",
        },
      }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;