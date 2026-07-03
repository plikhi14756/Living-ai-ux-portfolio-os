import Link from "next/link";
import { ArrowLeft, FileText, Globe2 } from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";

export const metadata = {
  title: "Living AI UX Portfolio OS Case Study"
};

const tools = [
  "Codex",
  "OpenAI API",
  "Next.js",
  "Supabase",
  "Vercel",
  "GitHub",
  "Tailwind CSS"
];

const workflow = [
  "Screenshot or manual entry",
  "AI extraction",
  "Portfolio scoring",
  "Confidentiality guard",
  "Human approval",
  "Public website update",
  "Branded PDF regeneration"
];

const learnings = [
  "AI workflow design",
  "Production deployment",
  "API integration",
  "Supabase migrations",
  "Vercel deployment",
  "GitHub workflow",
  "Privacy-aware publishing",
  "Portfolio automation"
];

export default function LivingAiUxPortfolioOsCaseStudyPage() {
  return (
    <PublicShell>
      <section className="container-page py-10">
        <p className="eyebrow">Case Study</p>
        <div className="mt-3 max-w-5xl">
          <h1 className="text-4xl font-black tracking-normal text-ink dark:text-paper md:text-5xl">
            Living AI UX Portfolio OS
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/72 dark:text-paper/72">
            A human-in-the-loop AI workflow for turning research-study evidence
            into a living AI UX portfolio.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn-primary" href="/">
            <Globe2 size={18} />
            View live portfolio
          </Link>
          <Link className="btn-secondary" href="/api/pdf/latest">
            <FileText size={18} />
            Open branded living PDF
          </Link>
          <Link className="btn-secondary" href="/projects">
            <ArrowLeft size={18} />
            Back to projects
          </Link>
        </div>
      </section>

      <section className="container-page grid gap-4 pb-10 md:grid-cols-3">
        <CaseBlock
          eyebrow="Problem"
          title="Manual portfolio upkeep was slowing down"
          body="I was completing more AI/UX/product research studies, but manually deciding, rewriting, organizing, and updating my portfolio was becoming slow and repetitive."
        />
        <CaseBlock
          eyebrow="Goal"
          title="Build a living portfolio system"
          body="Create a living portfolio system that can analyze screenshots and manual notes, classify portfolio relevance, protect confidentiality, and publish approved entries to a public portfolio website and branded PDF."
        />
        <CaseBlock
          eyebrow="My Role"
          title="Solo builder and workflow designer"
          body="Solo builder / AI workflow designer / product thinker."
        />
      </section>

      <section className="container-page grid gap-5 pb-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <p className="eyebrow">Tools</p>
          <h2 className="mt-3 text-2xl font-black">Production stack</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {tools.map((tool) => (
              <span className="tag" key={tool}>
                {tool}
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">Workflow</p>
          <h2 className="mt-3 text-2xl font-black">From evidence to published portfolio</h2>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {workflow.map((step, index) => (
              <span className="flex items-center gap-2" key={step}>
                <span className="tag">{step}</span>
                {index < workflow.length - 1 ? (
                  <span className="text-sm font-bold text-ink/40 dark:text-paper/40">
                    -&gt;
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-4 pb-10 md:grid-cols-2">
        <CaseBlock
          eyebrow="Human-In-The-Loop Design"
          title="AI recommends, Pranav approves"
          body="AI can recommend, classify, and draft portfolio text, but publishing requires human approval. The system is designed so automation speeds up judgment without replacing judgment."
        />
        <CaseBlock
          eyebrow="Privacy And Safety"
          title="Public output stays safe by default"
          body="Screenshots stay private, record-only studies stay private, public descriptions are confidentiality-safe, and the admin dashboard is protected."
        />
      </section>

      <section className="container-page grid gap-4 pb-10 md:grid-cols-2">
        <CaseBlock
          eyebrow="Outcome"
          title="A deployed living AI UX portfolio system"
          body="A deployed living AI UX portfolio website with private admin dashboard, AI analysis, approval workflow, and branded living PDF."
        />
        <div className="card">
          <p className="eyebrow">What I Learned</p>
          <h2 className="mt-3 text-2xl font-black">Skills strengthened</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {learnings.map((learning) => (
              <span className="tag" key={learning}>
                {learning}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-12">
        <div className="subtle-card flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Next Step</p>
            <h2 className="mt-2 text-2xl font-black">Explore the living portfolio</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/">
              View live portfolio
            </Link>
            <Link className="btn-secondary" href="/api/pdf/latest">
              Open branded living PDF
            </Link>
            <Link className="btn-secondary" href="/projects">
              Back to projects
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function CaseBlock({
  body,
  eyebrow,
  title
}: {
  body: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <article className="card">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-ink/72 dark:text-paper/72">
        {body}
      </p>
    </article>
  );
}
