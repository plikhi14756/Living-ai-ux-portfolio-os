import type { Metadata } from "next";
import "./globals.css";
import { SITE_BRAND_LINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: "Pranav Likhi — AI UX Research Portfolio",
    template: "%s | Living AI UX Portfolio OS"
  },
  description: SITE_BRAND_LINE,
  openGraph: {
    title: "Pranav Likhi — AI UX Research Portfolio",
    description: SITE_BRAND_LINE,
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
