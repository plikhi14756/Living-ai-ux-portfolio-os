import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";
import { StudyCard } from "@/components/study-card";
import {
  CONFIDENTIALITY_NOTE,
  SITE_BRAND_LINE
} from "@/lib/constants";
import { getSetting, listPublicStudies } from "@/lib/data/store";

export const dynamic = "force-dynamic";

type IdentitySetting = {
  homepageTitle?: string;
  homepageSubtitle?: string;
  intro?: string;
  confidentialityNote?: string;
};

export default async function HomePage() {
  const [studies, identity] = await Promise.all([
    listPublicStudies(),
    getSetting<IdentitySetting>("identity")
  ]);

  const featured = studies
    .filter(
      (study) =>
        study.portfolio_score >= 80 &&
        study.public_publish_recommendation === "Publish as portfolio highlight"
    )
    .sort((a, b) => b.portfolio_score - a.portfolio_score)
    .slice(0, 3);
  const latest = studies.slice(0, 4);

  return (
    <PublicShell>
      <section className="container-page grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr] md:py-16">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">{SITE_BRAND_LINE}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-ink dark:text-paper sm:text-5xl lg:text-6xl">
            {identity?.homepageTitle ??
              "Pranav Likhi — AI UX Research & Human-AI Interaction Portfolio"}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-ink/72 dark:text-paper/72">
            {identity?.homepageSubtitle ??
              "A living portfolio of AI evaluation, UX research participation, fintech UX, voice and conversational AI, and multilingual product feedback experience."}
          </p>
          <p className="mt-5 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
            {identity?.intro ??
              "I am building toward a career in AI UX Research and Human-AI Interaction, combining customer experience, product feedback, multilingual communication, and hands-on participation in AI and usability research studies."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="btn-primary" href="/portfolio">
              View Living Portfolio
              <ArrowRight size={17} />
            </Link>
            <Link className="btn-secondary" href="/api/pdf/latest">
              <FileText size={17} />
              PDF Portfolio
            </Link>
          </div>
        </div>
        <div className="grid content-center gap-4">
          <div className="card">
            <ShieldCheck className="text-moss dark:text-cyan" size={28} />
            <h2 className="mt-4 text-2xl font-bold">Confidentiality-first evidence system</h2>
            <p className="mt-3 text-sm leading-6 text-ink/68 dark:text-paper/68">
              {identity?.confidentialityNote ?? CONFIDENTIALITY_NOTE}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Approved" value={studies.length} />
            <Metric
              label="Major"
              value={
                studies.filter(
                  (study) => study.portfolio_classification === "Major portfolio project"
                ).length
              }
            />
            <Metric
              label="Avg score"
              value={
                studies.length
                  ? Math.round(
                      studies.reduce((sum, study) => sum + study.portfolio_score, 0) /
                        studies.length
                    )
                  : 0
              }
            />
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Featured AI UX Highlights</p>
            <h2 className="mt-2 text-3xl font-black">Strongest approved evidence</h2>
          </div>
          <Link className="btn-secondary" href="/projects">
            Major projects
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featured.map((study) => (
            <StudyCard study={study} key={study.id} />
          ))}
        </div>
      </section>

      <section className="container-page py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Latest Approved Portfolio Entries</p>
            <h2 className="mt-2 text-3xl font-black">Living experience log</h2>
          </div>
          <Link className="btn-secondary" href="/experience-log">
            Chronological log
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {latest.map((study) => (
            <StudyCard study={study} key={study.id} />
          ))}
        </div>
      </section>
    </PublicShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="subtle-card text-center">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold text-ink/58 dark:text-paper/58">
        {label}
      </p>
    </div>
  );
}
