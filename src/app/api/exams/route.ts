import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const base = process.env.API_BASE_URL;
    if (!base) throw new Error("API_BASE_URL is missing");

    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json({ message: "Missing Authorization" }, { status: 401 });
    }

    // ★クエリを upstream に転送する
    const upstreamUrl = new URL(`${base.replace(/\/$/, "")}/exams`);
    req.nextUrl.searchParams.forEach((v, k) => upstreamUrl.searchParams.set(k, v));

    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: { Authorization: auth },
    });

    const text = await upstream.text();

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { message: "Proxy crashed", error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
