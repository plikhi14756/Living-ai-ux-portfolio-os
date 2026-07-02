import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { getSetting, listStudies } from "@/lib/data/store";
import { generateAndStorePortfolioPdf } from "@/lib/pdf/generate-portfolio-pdf";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const setting = await getSetting<{ latestUrl?: string }>("pdf");
    let latestUrl = setting?.latestUrl ?? "";

    if (!latestUrl) {
      const studies = await listStudies({ approvedOnly: true });
      const pdf = await generateAndStorePortfolioPdf(studies);
      latestUrl = pdf.publicUrl;
    }

    return NextResponse.redirect(new URL(latestUrl, request.url));
  } catch (error) {
    return apiError(error);
  }
}
