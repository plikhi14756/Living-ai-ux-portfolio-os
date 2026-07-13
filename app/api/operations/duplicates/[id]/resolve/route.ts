import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { resolveDuplicateAuditLog } from "@/lib/portfolio-operations/duplicates/resolve-duplicate";

const BodySchema = z.object({
  resolution: z.enum([
    "replaced_existing",
    "kept_new",
    "kept_both",
    "cancelled",
    "false_positive"
  ]),
  note: z.string().max(1000).optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = BodySchema.parse(await request.json());
    const audit = await resolveDuplicateAuditLog({
      auditId: id,
      resolution: body.resolution,
      note: body.note ?? ""
    });
    return NextResponse.json({ audit });
  } catch (error) {
    return apiError(error);
  }
}
