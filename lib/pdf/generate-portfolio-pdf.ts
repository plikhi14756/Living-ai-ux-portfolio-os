import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDF_TITLE } from "@/lib/constants";
import { setSetting } from "@/lib/data/store";
import { isProductionDeployment } from "@/lib/env";
import {
  buildLivingPortfolioModel,
  createLivingPortfolioPdfBuffer,
  publicPortfolioStudies
} from "@/lib/pdf/generate-living-portfolio";
import { LATEST_LIVING_PDF_FILENAME } from "@/lib/pdf/styles";
import {
  getSupabaseAdmin,
  supabaseConfigurationError
} from "@/lib/supabase/server";
import type { Study } from "@/lib/types";

export async function generateAndStorePortfolioPdf(studies: Study[]) {
  const includedEntries = publicPortfolioStudies(studies);
  const model = buildLivingPortfolioModel(includedEntries);

  console.info("[pdf] Regenerating branded living portfolio PDF", {
    includedEntryCount: includedEntries.length,
    styleMode: "branded"
  });

  const pdf = createLivingPortfolioPdfBuffer(includedEntries);
  const filename = LATEST_LIVING_PDF_FILENAME;
  const supabase = getSupabaseAdmin();
  let publicUrl = `/exports/${filename}`;
  const version = new Date().toISOString();

  if (supabase) {
    const { error } = await supabase.storage
      .from("portfolio-exports")
      .upload(filename, pdf, {
        contentType: "application/pdf",
        cacheControl: "60",
        upsert: true
      });
    if (error) {
      console.error("[pdf] Supabase branded PDF upload failed", {
        bucket: "portfolio-exports",
        path: filename,
        error: error.message
      });
      throw error;
    }
    console.info("[pdf] Supabase branded PDF upload succeeded", {
      bucket: "portfolio-exports",
      path: filename,
      bytes: pdf.length
    });

    const { data } = supabase.storage
      .from("portfolio-exports")
      .getPublicUrl(filename);
    publicUrl = data.publicUrl;
  } else {
    if (isProductionDeployment()) {
      throw new Error(
        supabaseConfigurationError() ??
          "Supabase storage is required for production PDF exports. Local export fallback is disabled for launch."
      );
    }

    const exportDir = join(process.cwd(), "public", "exports");
    await mkdir(exportDir, { recursive: true });
    await writeFile(join(exportDir, filename), pdf);
  }

  const versionedUrl = `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;

  await setSetting("pdf", {
    title: PDF_TITLE,
    latestUrl: versionedUrl,
    latestStoragePath: filename,
    latestVersion: version,
    lastGeneratedAt: version,
    styleMode: "branded",
    includedEntryCount: includedEntries.length,
    activeSections: model.sections.map((section) => section.title)
  });

  await setSetting("pdf_style_settings", {
    PDF_STYLE_MODE: "branded",
    template: "branded-living-portfolio",
    latestFilename: filename,
    updatedAt: version
  });

  console.info("[pdf] Branded living portfolio PDF regenerated", {
    includedEntryCount: includedEntries.length,
    path: filename,
    styleMode: "branded",
    url: versionedUrl
  });

  return {
    publicUrl: versionedUrl,
    buffer: pdf,
    includedEntryCount: includedEntries.length,
    styleMode: "branded" as const
  };
}
