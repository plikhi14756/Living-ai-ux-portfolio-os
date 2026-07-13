import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { markReleaseDismissed } from "@/lib/portfolio-operations/releases";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const view = await markReleaseDismissed(id);
    return NextResponse.json({ view });
  } catch (error) {
    return apiError(error);
  }
}
