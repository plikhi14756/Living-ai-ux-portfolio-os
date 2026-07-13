import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { createOperationsAuditLog, updateMaintenanceIssue } from "@/lib/data/store";

const BodySchema = z.object({
  status: z.enum(["open", "acknowledged", "resolved", "ignored"]),
  resolution_note: z.string().max(1000).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = BodySchema.parse(await request.json());
    const resolved_at =
      body.status === "resolved" || body.status === "ignored"
        ? new Date().toISOString()
        : null;
    const issue = await updateMaintenanceIssue(id, {
      status: body.status,
      resolved_at,
      resolution_note: body.resolution_note ?? null
    });

    await createOperationsAuditLog({
      action: `maintenance_issue_${body.status}`,
      entity_type: "maintenance_issue",
      entity_id: id,
      actor: "admin",
      before_state: null,
      after_state: issue,
      metadata: { resolutionNote: body.resolution_note ?? "" }
    });

    return NextResponse.json({ issue });
  } catch (error) {
    return apiError(error);
  }
}
