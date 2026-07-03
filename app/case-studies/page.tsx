import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";
import { CASE_STUDIES } from "@/lib/case-studies";

export const metadata = {
  title: "Case Studies"
};

export default function CaseStudiesPage() {
  return (
    <PublicShell>
      <section className="container-page py-10">
        <p className="eyebrow">Case Studies</p>
        <h1 className="mt-3 text-4xl font-black">AI UX workflow and project case studies</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
          Deeper project writeups showing the problem, process, design
          decisions, privacy choices, outcomes, and learnings behind selected
          AI UX and workflow projects.
        </p>
      </section>

      <section className="container-page grid gap-4 pb-12 md:grid-cols-2">
        {CASE_STUDIES.map((caseStudy) => (
          <article className="card flex h-full flex-col gap-4" key={caseStudy.href}>
            <div>
              <p className="eyebrow">Case Study</p>
              <h2 className="mt-3 text-2xl font-black">{caseStudy.title}</h2>
              <p className="mt-3 text-sm leading-6 text-ink/72 dark:text-paper/72">
                {caseStudy.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {caseStudy.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-auto pt-2">
              <Link className="btn-primary" href={caseStudy.href}>
                Read Case Study
                <ArrowRight size={17} />
              </Link>
            </div>
          </article>
        ))}
      </section>
    </PublicShell>
  );
}
