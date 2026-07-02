import Link from "next/link";
import { FileText, GraduationCap, ScrollText, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";
import { LINKEDIN_FEATURED_ITEMS } from "@/lib/constants";
import { getSetting } from "@/lib/data/store";
import { ORIGINAL_PORTFOLIO_PDF_URL } from "@/lib/data/original-portfolio";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Documents"
};

export default async function DocumentsPage() {
  const pdf = await getSetting<{ latestUrl?: string; lastGeneratedAt?: string }>("pdf");

  return (
    <PublicShell>
      <section className="container-page py-10">
        <p className="eyebrow">Documents</p>
        <h1 className="mt-3 text-4xl font-black">Portfolio PDFs, certificates, and future posts</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
          The public website is the living system of record. The PDF version is
          regenerated from approved entries and is designed for sharing in
          recruiter or LinkedIn Featured contexts.
        </p>
      </section>

      <section className="container-page grid gap-4 pb-12 md:grid-cols-2">
        <DocumentCard
          icon={<FileText size={22} />}
          title="Static polished portfolio PDF"
          body="A curated export for applications, recruiter conversations, and LinkedIn Featured."
          action={<Link className="btn-primary" href={ORIGINAL_PORTFOLIO_PDF_URL}>Open static PDF</Link>}
          meta="Imported from the original portfolio file"
        />
        <DocumentCard
          icon={<Sparkles size={22} />}
          title="Living PDF export"
          body="Automatically rebuilt after approved portfolio entries are published."
          action={<Link className="btn-secondary" href="/api/pdf/latest">Living export</Link>}
          meta={
            pdf?.lastGeneratedAt
              ? `Last generated ${new Date(pdf.lastGeneratedAt).toLocaleString("en-US")}`
              : "Generate from the admin dashboard after approvals"
          }
        />
        <DocumentCard
          icon={<GraduationCap size={22} />}
          title="Graduation and education documents"
          body="Placeholder for education records and supporting documents."
        />
        <DocumentCard
          icon={<ScrollText size={22} />}
          title="Certificates and future journey posts"
          body="Placeholder for certificates, learning milestones, and public reflections."
        />
      </section>

      <section className="container-page pb-12">
        <div className="card">
          <p className="eyebrow">LinkedIn Featured Text</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {LINKEDIN_FEATURED_ITEMS.map((item) => (
              <div className="subtle-card" key={item.title}>
                <h2 className="text-lg font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink/68 dark:text-paper/68">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function DocumentCard({
  action,
  body,
  icon,
  meta,
  title
}: {
  action?: React.ReactNode;
  body: string;
  icon: React.ReactNode;
  meta?: string;
  title: string;
}) {
  return (
    <article className="card">
      <div className="text-moss dark:text-cyan">{icon}</div>
      <h2 className="mt-4 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink/68 dark:text-paper/68">{body}</p>
      {meta ? (
        <p className="mt-3 text-xs font-semibold text-ink/50 dark:text-paper/50">{meta}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </article>
  );
}
