export type Rgb = readonly [number, number, number];

export const LATEST_LIVING_PDF_FILENAME = "living-ai-ux-portfolio-latest.pdf";

export const PDF_PAGE = {
  width: 612,
  height: 792,
  marginX: 46,
  marginTop: 74,
  marginBottom: 58
} as const;

export const PDF_COLORS = {
  ink: [0.11, 0.13, 0.15],
  muted: [0.35, 0.38, 0.41],
  teal: [0.07, 0.25, 0.3],
  tealSoft: [0.9, 0.94, 0.95],
  cyanSoft: [0.86, 0.96, 0.97],
  paper: [1, 1, 1],
  rule: [0.78, 0.84, 0.86],
  sand: [0.97, 0.97, 0.94],
  tag: [0.93, 0.96, 0.96],
  gold: [0.73, 0.57, 0.22]
} as const satisfies Record<string, Rgb>;

export const LIVING_PDF_CATEGORIES = [
  "AI Workflow Projects",
  "Major AI UX Projects",
  "AI Evaluation Experience",
  "Fintech & Banking UX",
  "Voice & Conversational AI",
  "Multilingual Product Evaluation",
  "Usability Testing & Product Feedback"
] as const;

export const PDF_SKILL_GROUPS = [
  {
    title: "AI Workflow Design",
    keywords: [
      "workflow",
      "automation",
      "agent",
      "genai",
      "ai-assisted",
      "productivity",
      "portfolio system"
    ]
  },
  {
    title: "Human-AI Interaction",
    keywords: [
      "human-ai",
      "hci",
      "trust",
      "responsible ai",
      "interaction",
      "decision support"
    ]
  },
  {
    title: "UX Research Documentation",
    keywords: [
      "documentation",
      "case study",
      "qualitative",
      "research participation",
      "moderated",
      "focus group",
      "interview"
    ]
  },
  {
    title: "AI Evaluation",
    keywords: [
      "ai evaluation",
      "model",
      "rating",
      "rubric",
      "response quality",
      "output assessment"
    ]
  },
  {
    title: "Product Feedback",
    keywords: [
      "product feedback",
      "feature",
      "usability",
      "prototype",
      "product thinking",
      "customer experience"
    ]
  },
  {
    title: "Fintech UX",
    keywords: ["fintech", "financial", "banking", "investment"]
  },
  {
    title: "Voice & Conversational AI",
    keywords: [
      "voice",
      "speech",
      "conversation",
      "conversational",
      "assistant",
      "audio"
    ]
  },
  {
    title: "Multilingual Product Evaluation",
    keywords: [
      "multilingual",
      "language",
      "hindi",
      "punjabi",
      "translation",
      "cultural"
    ]
  },
  {
    title: "Technical Tools",
    keywords: [
      "next.js",
      "typescript",
      "tailwind",
      "supabase",
      "openai",
      "vercel",
      "zod",
      "pdf"
    ]
  }
] as const;
