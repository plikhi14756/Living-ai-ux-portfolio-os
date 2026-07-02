export function isProductionDeployment() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    process.env.VERCEL_ENV === "production" ||
    Boolean(
      process.env.NODE_ENV === "production" &&
        siteUrl &&
        !siteUrl.includes("localhost") &&
        !siteUrl.includes("127.0.0.1")
    )
  );
}
