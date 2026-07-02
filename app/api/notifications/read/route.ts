import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { markNotificationsRead } from "@/lib/data/store";

export const runtime = "nodejs";

export async function POST() {
  try {
    await markNotificationsRead();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
