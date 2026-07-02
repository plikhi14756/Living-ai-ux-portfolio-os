import { NextResponse, type NextRequest } from "next/server";
import { isProductionDeployment } from "@/lib/env";

const ADMIN_COOKIE = "living_ai_admin";

const protectedApiPrefixes = [
  "/api/admin",
  "/api/analyze-study",
  "/api/manual-experience",
  "/api/studies",
  "/api/design-review",
  "/api/import-original-portfolio",
  "/api/maintenance",
  "/api/export-pdf",
  "/api/settings",
  "/api/notifications",
  "/api/storage/screenshot"
];

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/uploads/studies") ||
    protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

export function middleware(request: NextRequest) {
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;
  const { pathname, searchParams } = request.nextUrl;
  const productionDeployment = isProductionDeployment();

  if (pathname === "/admin-login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!adminToken) {
    if (!productionDeployment) {
      return NextResponse.next();
    }

    if (isApiPath(pathname) || pathname.startsWith("/uploads/studies")) {
      return NextResponse.json(
        { error: "Admin authentication is not configured for production." },
        { status: 503 }
      );
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin-login";
    loginUrl.searchParams.set("next", pathname);
    loginUrl.searchParams.set("setup", "missing-admin-token");
    return NextResponse.redirect(loginUrl);
  }

  const suppliedToken =
    request.cookies.get(ADMIN_COOKIE)?.value ||
    request.headers.get("x-admin-token") ||
    searchParams.get("admin_token");

  if (suppliedToken === adminToken) {
    const response = NextResponse.next();
    if (searchParams.get("admin_token") === adminToken) {
      response.cookies.set(ADMIN_COOKIE, adminToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12
      });
    }
    return response;
  }

  if (isApiPath(pathname)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin-login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/uploads/studies/:path*"]
};
