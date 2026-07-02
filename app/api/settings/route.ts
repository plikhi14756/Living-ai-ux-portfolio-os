import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { createNotification, setSetting } from "@/lib/data/store";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      await setSetting(key, value);
    }

    await createNotification({
      title: "Settings updated",
      message: "Site identity, portfolio, AI, privacy, notification, or PDF settings were saved.",
      type: "settings",
      read: false,
      related_study_id: null
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
