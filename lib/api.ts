import { NextResponse } from "next/server";
import { isProductionDeployment } from "@/lib/env";

export function apiError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unknown server error";
  console.error(error);
  return NextResponse.json({ error: message }, { status });
}

export function requireCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return !isProductionDeployment();

  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}
