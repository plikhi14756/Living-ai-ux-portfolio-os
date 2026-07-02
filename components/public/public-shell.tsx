import { Footer } from "@/components/public/footer";
import { SiteHeader } from "@/components/public/site-header";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <Footer />
    </>
  );
}
