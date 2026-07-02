import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { isProductionDeployment } from "@/lib/env";
import {
  getSupabaseAdmin,
  supabaseConfigurationError
} from "@/lib/supabase/server";

export type StoredScreenshot = {
  publicUrl: string;
  dataUrl: string;
};

const SCREENSHOT_PROXY_PREFIX = "/api/storage/screenshot/";
const LOCAL_SCREENSHOT_PROXY_PREFIX = `${SCREENSHOT_PROXY_PREFIX}local/`;
const LOCAL_UPLOAD_PREFIX = "/uploads/studies/";
const LOCAL_UPLOAD_DIR = join(process.cwd(), "public", "uploads", "studies");

function safeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
}

function mimeFromFilename(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/png";
}

async function fileToBuffer(file: File) {
  return Buffer.from(await file.arrayBuffer());
}

function dataUrlFromBuffer(buffer: Buffer, mime = "image/png") {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function pathnameFromUrl(url: string) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function storagePathFromScreenshotUrl(url: string) {
  const pathname = pathnameFromUrl(url);

  if (pathname.startsWith(SCREENSHOT_PROXY_PREFIX)) {
    return pathname
      .slice(SCREENSHOT_PROXY_PREFIX.length)
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent)
      .join("/");
  }

  const storageMarkers = [
    "/storage/v1/object/sign/study-screenshots/",
    "/storage/v1/object/public/study-screenshots/",
    "/storage/v1/object/authenticated/study-screenshots/"
  ];

  for (const marker of storageMarkers) {
    const index = pathname.indexOf(marker);
    if (index !== -1) {
      return decodeURIComponent(pathname.slice(index + marker.length));
    }
  }

  return null;
}

function localUploadPathFromScreenshotUrl(url: string) {
  const pathname = pathnameFromUrl(url);

  let filename = "";
  if (pathname.startsWith(LOCAL_SCREENSHOT_PROXY_PREFIX)) {
    filename = basename(
      decodeURIComponent(pathname.slice(LOCAL_SCREENSHOT_PROXY_PREFIX.length))
    );
  } else if (pathname.startsWith(LOCAL_UPLOAD_PREFIX)) {
    filename = basename(decodeURIComponent(pathname));
  }

  if (!filename) return null;

  return {
    path: join(LOCAL_UPLOAD_DIR, filename),
    mime: mimeFromFilename(filename)
  };
}

export async function saveStudyScreenshots(files: File[]) {
  if (!files.length) return [] as StoredScreenshot[];

  const supabase = getSupabaseAdmin();
  const stored: StoredScreenshot[] = [];

  for (const file of files) {
    if (!file.size) continue;

    const mime = file.type || mimeFromFilename(file.name || "screenshot.png");
    const buffer = await fileToBuffer(file);
    const filename = `${crypto.randomUUID()}-${safeFilename(file.name || "screenshot.png")}`;
    const dataUrl = dataUrlFromBuffer(buffer, mime);

    console.info("[analyze-study] Screenshot base64 conversion succeeded", {
      name: file.name || "screenshot.png",
      type: mime,
      size: file.size,
      dataUrlBytes: dataUrl.length
    });

    if (supabase) {
      const path = `studies/${filename}`;
      const { error } = await supabase.storage
        .from("study-screenshots")
        .upload(path, buffer, {
          contentType: mime,
          upsert: false
        });

      if (error) throw error;

      const proxiedPath = path.split("/").map(encodeURIComponent).join("/");
      const publicUrl = `/api/storage/screenshot/${proxiedPath}`;
      console.info("[analyze-study] Screenshot stored", {
        mode: "supabase",
        url: publicUrl,
        storagePath: path
      });
      stored.push({ publicUrl, dataUrl });
    } else {
      if (isProductionDeployment()) {
        throw new Error(
          supabaseConfigurationError() ??
            "Supabase storage is required in production. Local screenshot fallback is disabled for launch."
        );
      }

      const relativeUrl = `${LOCAL_SCREENSHOT_PROXY_PREFIX}${encodeURIComponent(filename)}`;
      const localPath = join(LOCAL_UPLOAD_DIR, filename);
      await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
      await writeFile(localPath, buffer);
      console.info("[analyze-study] Screenshot stored", {
        mode: "local",
        url: relativeUrl,
        path: localPath
      });
      stored.push({ publicUrl: relativeUrl, dataUrl });
    }
  }

  return stored;
}

export async function loadStoredScreenshotsForAnalysis(urls: string[]) {
  const supabase = getSupabaseAdmin();
  const dataUrls: string[] = [];

  for (const url of urls) {
    const localUpload = localUploadPathFromScreenshotUrl(url);

    if (localUpload) {
      if (isProductionDeployment()) {
        console.warn("[analyze-study] Local screenshot fallback blocked in production", {
          url
        });
        continue;
      }

      const buffer = await readFile(localUpload.path);
      const dataUrl = dataUrlFromBuffer(buffer, localUpload.mime);
      console.info("[analyze-study] Loaded local screenshot for re-analysis", {
        url,
        type: localUpload.mime,
        size: buffer.length,
        dataUrlBytes: dataUrl.length
      });
      dataUrls.push(dataUrl);
      continue;
    }

    const storagePath = storagePathFromScreenshotUrl(url);
    if (!supabase || !storagePath) {
      console.warn("[analyze-study] Could not load stored screenshot", { url });
      continue;
    }

    const { data, error } = await supabase.storage
      .from("study-screenshots")
      .download(storagePath);

    if (error || !data) {
      console.warn("[analyze-study] Supabase screenshot download failed", {
        url,
        storagePath,
        error: error?.message
      });
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const mime = data.type || mimeFromFilename(storagePath);
    const dataUrl = dataUrlFromBuffer(buffer, mime);
    console.info("[analyze-study] Loaded Supabase screenshot for re-analysis", {
      url,
      storagePath,
      type: mime,
      size: buffer.length,
      dataUrlBytes: dataUrl.length
    });
    dataUrls.push(dataUrl);
  }

  return dataUrls;
}
