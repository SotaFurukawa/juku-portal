import { NextRequest } from "next/server";

const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN || "https://juku-efficiency-system.sg-fujidera.com";

function getApiBase(): string {
  return (process.env.API_BASE_URL || process.env.API_BASE || "").trim();
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function handle(req: NextRequest, method: string, params: { path: string[] }) {
  // ★ ログ：ここが増えると「どこで落ちたか」即分かる
  console.log("[proxy] called", { method, path: params.path.join("/") });
  console.log("[proxy] API_BASE_URL =", process.env.API_BASE_URL);
  console.log("[proxy] API_BASE =", process.env.API_BASE);

  try {
    const base = getApiBase();
    if (!base) {
      console.error("[proxy] missing API base env");
      return Response.json(
        { message: "Proxy misconfigured: API_BASE_URL (or API_BASE) is missing" },
        { status: 500, headers: corsHeaders() }
      );
    }

    // /api/proxy/<...> -> <API_BASE>/<...>
    const upstreamUrl = `${base}/${params.path.map(encodeURIComponent).join("/")}`;
    console.log("[proxy] upstream =", upstreamUrl);

    // Authorization を上流へ引き継ぐ
    const auth = req.headers.get("authorization") || "";

    // ボディ（GET/HEADは送らない）
    let body: string | undefined = undefined;
    if (method !== "GET" && method !== "HEAD") {
      body = await req.text();
    }

    const upstreamRes = await fetch(upstreamUrl, {
      method,
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        ...(req.headers.get("content-type")
          ? { "Content-Type": req.headers.get("content-type")! }
          : { "Content-Type": "application/json" }),
      },
      body,
      cache: "no-store",
    });

    const text = await upstreamRes.text();
    console.log("[proxy] upstream status =", upstreamRes.status);

    if (!upstreamRes.ok) {
      console.error("[proxy] upstream error body =", text.slice(0, 2000));
    }

    return new Response(text, {
      status: upstreamRes.status,
      headers: {
        ...corsHeaders(),
        "Content-Type": upstreamRes.headers.get("content-type") || "application/json",
      },
    });
  } catch (e: any) {
    console.error("[proxy] failed", e?.message || e, e?.stack);
    return Response.json(
      { message: "proxy failed", detail: String(e?.message || e) },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handle(req, "GET", ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handle(req, "POST", ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handle(req, "PUT", ctx.params);
}
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handle(req, "PATCH", ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return handle(req, "DELETE", ctx.params);
}