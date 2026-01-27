// src/app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.API_BASE_URL ||
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE;

function normalizeParams(params: any): Promise<{ path?: string[] }> {
  // Next のバージョンによって params が Promise の場合があるので吸収する
  if (params && typeof params.then === "function") return params;
  return Promise.resolve(params ?? {});
}

async function handler(req: NextRequest, ctx: { params: any }) {
  try {
    if (!API_BASE) {
      return NextResponse.json(
        { message: "Proxy misconfigured: API_BASE_URL (or API_BASE) is missing" },
        { status: 500 }
      );
    }

    const resolved = await normalizeParams(ctx.params);
    const pathArr: string[] | undefined = resolved?.path;

    if (!pathArr || pathArr.length === 0) {
      return NextResponse.json(
        { message: "Missing path (e.g. /api/proxy/exams/meta)" },
        { status: 400 }
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
        ...(req.headers.get("content-type") ? { "content-type": req.headers.get("content-type")! } : {}),
        ...(auth ? { Authorization: auth } : {}),
      },
      body,
      cache: "no-store",
    });

    const buf = await upstreamRes.arrayBuffer();
    const outHeaders = new Headers();

    const ct = upstreamRes.headers.get("content-type");
    if (ct) outHeaders.set("content-type", ct);

    return new NextResponse(buf, { status: upstreamRes.status, headers: outHeaders });
  } catch (e: any) {
    return NextResponse.json(
      { message: "Proxy crashed", error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
