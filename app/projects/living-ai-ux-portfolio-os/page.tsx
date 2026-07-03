import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Globe2,
  Layers3,
  ShieldCheck,
  Workflow
} from "lucide-react";
import { PublicShell } from "@/components/public/public-shell";

export const metadata = {
  title: "Living AI UX Portfolio OS"
};

const tags = [
  "AI Workflow Design",
  "Human-AI Interaction",
  "Portfolio Automation",
  "OpenAI API",
  "Supabase",
  "Vercel",
  "Next.js"
];

const goals = [
  "Analyze screenshots and manual notes",
  "Extract visible study details",
  "Classify portfolio relevance",
  "Separate record-only studies from public-worthy experiences",
  "Protect confidential evidence",
  "Publish approved entries to a public portfolio website",
  "Regenerate a branded living PDF portfolio"
];

const tools = [
  "Codex",
  "OpenAI API",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Supabase database and storage",
  "Vercel deployment",
  "GitHub",
  "Branded PDF generation"
];

const workflowSteps = [
  "Screenshot or manual entry",
  "AI extraction",
  "Portfolio relevance scoring",
  "Confidentiality guard",
  "Human approval",
  "Public website update",
  "Branded PDF regeneration"
];

const privacyDecisions = [
  "Admin dashboard is protected",
  "Screenshots stay private",
  "Record-only studies stay private",
  "Public portfolio only shows approved, public-worthy entries",
  "Confidential details, study IDs, completion codes, researcher names, and private prototypes are not published",
  "LinkedIn text is generated, but not auto-posted"
];

const designDecisions = [
  {
    title: "Living website instead of only a static PDF",
    body:
      "A website can update as new approved experiences are added, while a static PDF becomes stale quickly. The living site acts as the system of record."
  },
  {
    title: "Low-score studies stay private",
    body:
      "Not every completed study should become public portfolio material. Record-only tracking preserves the evidence without weakening the public signal."
  },
  {
    title: "Branded living PDF and original static PDF stay separate",
    body:
      "The original curated portfolio remains available as a static artifact, while the branded living PDF is regenerated from approved public entries."
  },
  {
    title: "AI confidence and portfolio value are separate",
    body:
      "The AI can be confident about reading visible screenshot details while still assigning a low portfolio score if the study is not relevant to AI UX, HCI, product feedback, or evaluation work."
  }
];

const outcomes = [
  "Public living portfolio website",
  "Private admin dashboard",
  "Screenshot/manual analysis",
  "Approval workflow",
  "Record-only/private tracking",
  "Branded living PDF generation",
  "Original static PDF kept separate",
  "LinkedIn-ready project and featured structure"
];

const learnings = [
  "AI workflow design",
  "Production deployment",
  "API key and billing setup",
  "Supabase migrations",
  "Vercel deployment",
  "GitHub workflow",
  "Recommendation consistency",
  "Privacy-aware publishing",
  "Branded PDF generation",
  "Human-in-the-loop AI system design"
];

export default function LivingAiUxPortfolioOsCaseStudyPage() {
  return (
    <PublicShell>
      <section className="container-page py-10 md:py-14">
        <p className="eyebrow">Case Study</p>
        <div className="mt-3 max-w-5xl">
          <h1 className="text-4xl font-black leading-tight text-ink dark:text-paper md:text-5xl">
            Living AI UX Portfolio OS
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/72 dark:text-paper/72">
            A human-in-the-loop AI workflow for turning research-study evidence
            into a living AI UX portfolio.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="btn-primary" href="/">
            <Globe2 size={18} />
            View Live Portfolio
          </Link>
          <Link className="btn-secondary" href="/documents">
            <FileText size={18} />
            Open Branded Living PDF
          </Link>
          <Link className="btn-secondary" href="/projects">
            <ArrowLeft size={18} />
            Back to Projects
          </Link>
        </div>
      </section>

      <section className="container-page grid gap-4 pb-10 lg:grid-cols-[1fr_1fr]">
        <TextSection
          eyebrow="Overview"
          icon={<Layers3 size={22} />}
          title="A self-directed AI workflow project"
          body="Living AI UX Portfolio OS is a self-directed AI workflow project I built to help organize and publish my growing AI/UX research-study experience. The system turns screenshots and manual notes into structured, confidentiality-safe portfolio entries after human approval."
        />
        <TextSection
          eyebrow="Problem"
          icon={<Workflow size={22} />}
          title="Manual updates were becoming repetitive"
          body="I was completing more Prolific, UserTesting, Userlytics, TELUS, and AI/product research studies, but manually updating my portfolio was becoming slow and repetitive. Every new relevant study required me to decide whether it was portfolio-worthy, rewrite it safely, update the website/PDF, and keep my LinkedIn materials aligned."
        />
      </section>

      <section className="container-page pb-10">
        <div className="mb-5">
          <p className="eyebrow">Goal</p>
          <h2 className="mt-2 text-3xl font-black">Build a living portfolio system</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <IconLine text={goal} key={goal} />
          ))}
        </div>
      </section>

      <section className="container-page grid gap-4 pb-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card">
          <p className="eyebrow">My Role</p>
          <h2 className="mt-3 text-2xl font-black">
            Solo builder, AI workflow designer, product thinker, and user of the system.
          </h2>
        </div>
        <div className="card">
          <p className="eyebrow">Tools And Stack</p>
          <h2 className="mt-3 text-2xl font-black">Production workflow stack</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {tools.map((tool) => (
              <span className="tag" key={tool}>
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-10">
        <div className="mb-5">
          <p className="eyebrow">Workflow</p>
          <h2 className="mt-2 text-3xl font-black">From research evidence to public portfolio</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
          {workflowSteps.map((step, index) => (
            <div className="subtle-card" key={step}>
              <p className="text-xs font-black text-moss dark:text-cyan">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-sm font-bold leading-5">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page grid gap-4 pb-10 md:grid-cols-2">
        <TextSection
          eyebrow="Human-In-The-Loop Design"
          icon={<CheckCircle2 size={22} />}
          title="AI recommends, but publishing requires approval"
          body="The AI does not publish automatically. It analyzes, scores, drafts, and recommends. I approve, edit, save as record-only, or reject before anything becomes public."
        />
        <div className="card">
          <div className="text-moss dark:text-cyan">
            <ShieldCheck size={22} />
          </div>
          <p className="eyebrow mt-4">Privacy And Safety Decisions</p>
          <h2 className="mt-3 text-2xl font-black">Public output stays safe by default</h2>
          <div className="mt-5 grid gap-3">
            {privacyDecisions.map((decision) => (
              <IconLine text={decision} variant="plain" key={decision} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-10">
        <div className="mb-5">
          <p className="eyebrow">Design Decisions</p>
          <h2 className="mt-2 text-3xl font-black">How I shaped the system</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {designDecisions.map((decision) => (
            <article className="card" key={decision.title}>
              <h3 className="text-xl font-bold">{decision.title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/72 dark:text-paper/72">
                {decision.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-page grid gap-4 pb-10 lg:grid-cols-[1fr_1fr]">
        <div className="card">
          <p className="eyebrow">Outcome</p>
          <h2 className="mt-3 text-2xl font-black">A deployed living AI UX portfolio system</h2>
          <div className="mt-5 grid gap-3">
            {outcomes.map((outcome) => (
              <IconLine text={outcome} variant="plain" key={outcome} />
            ))}
          </div>
        </div>
        <div className="card">
          <p className="eyebrow">What I Learned</p>
          <h2 className="mt-3 text-2xl font-black">Skills strengthened through the build</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {learnings.map((learning) => (
              <span className="tag" key={learning}>
                {learning}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page pb-10">
        <div className="subtle-card">
          <p className="eyebrow">Reflection</p>
          <h2 className="mt-2 text-3xl font-black">
            From research participation to workflow design
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-7 text-ink/72 dark:text-paper/72">
            This project shifted my portfolio from only showing research
            participation to also showing that I can design and deploy an
            AI-assisted workflow system around my career journey.
          </p>
        </div>
      </section>

      <section className="container-page pb-12">
        <div className="flex flex-wrap gap-3">
          <Link className="btn-primary" href="/">
            <Globe2 size={18} />
            View Live Portfolio
          </Link>
          <Link className="btn-secondary" href="/documents">
            <FileText size={18} />
            Open Branded Living PDF
          </Link>
          <Link className="btn-secondary" href="/projects">
            <ArrowLeft size={18} />
            Back to Projects
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}

function TextSection({
  body,
  eyebrow,
  icon,
  title
}: {
  body: string;
  eyebrow: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <article className="card">
      <div className="text-moss dark:text-cyan">{icon}</div>
      <p className="eyebrow mt-4">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-ink/72 dark:text-paper/72">
        {body}
      </p>
    </article>
  );
}

function IconLine({
  text,
  variant = "card"
}: {
  text: string;
  variant?: "card" | "plain";
}) {
  return (
    <div
      className={
        variant === "card"
          ? "subtle-card flex items-start gap-3"
          : "flex items-start gap-3 rounded-lg border border-ink/10 px-3 py-2 dark:border-white/10"
      }
    >
      <CheckCircle2
        className="mt-0.5 shrink-0 text-moss dark:text-cyan"
        size={17}
      />
      <p className="text-sm font-semibold leading-6">{text}</p>
    </div>
  );
}
