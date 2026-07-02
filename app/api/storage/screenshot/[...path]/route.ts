import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

function mimeFromFilename(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/png";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;

    if (path[0] === "local") {
      const filename = basename(decodeURIComponent(path.slice(1).join("/")));
      if (!filename) {
        return NextResponse.json({ error: "Screenshot not found." }, { status: 404 });
      }

      const localPath = join(
        process.cwd(),
        "public",
        "uploads",
        "studies",
        filename
      );
      const buffer = await readFile(localPath);

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeFromFilename(filename),
          "Cache-Control": "private, max-age=300"
        }
      });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase storage is not configured." }, { status: 404 });
    }

    const storagePath = path.join("/");
    const { data, error } = await supabase.storage
      .from("study-screenshots")
      .download(storagePath);

    if (error || !data) {
      return NextResponse.json({ error: "Screenshot not found." }, { status: 404 });
    }

    return new NextResponse(data.stream(), {
      headers: {
        "Content-Type": data.type || "image/png",
        "Cache-Control": "private, max-age=300"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
