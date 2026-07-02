import { NextResponse, type NextRequest } from "next/server";
import { isProductionDeployment } from "@/lib/env";

const ADMIN_COOKIE = "living_ai_admin";

export async function POST(request: NextRequest) {
  const expectedToken = process.env.ADMIN_ACCESS_TOKEN;
  const body = await request.json().catch(() => ({}));
  const suppliedToken = String(body.token ?? "");
  const nextPath = String(body.next ?? "/admin");

  if (!expectedToken) {
    if (isProductionDeployment()) {
      return NextResponse.json(
        { error: "Admin authentication is not configured for production." },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, redirectTo: nextPath });
  }

  if (suppliedToken !== expectedToken) {
    return NextResponse.json({ error: "Invalid admin token." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, redirectTo: nextPath });
  response.cookies.set(ADMIN_COOKIE, expectedToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
