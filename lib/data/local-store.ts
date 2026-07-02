import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CONFIDENTIALITY_NOTE,
  LINKEDIN_FEATURED_ITEMS,
  PDF_TITLE,
  PORTFOLIO_CATEGORIES,
  SITE_BRAND_LINE
} from "@/lib/constants";
import {
  ORIGINAL_PORTFOLIO_PDF_URL,
  ORIGINAL_PORTFOLIO_STUDIES
} from "@/lib/data/original-portfolio";
import type {
  DesignReview,
  MaintenanceReport,
  Notification,
  SiteSetting,
  Study
} from "@/lib/types";

type LocalDb = {
  studies: Study[];
  design_reviews: DesignReview[];
  maintenance_reports: MaintenanceReport[];
  notifications: Notification[];
  site_settings: SiteSetting[];
};

const DB_DIR = join(process.cwd(), ".local-data");
const DB_PATH = join(DB_DIR, "db.json");

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

const seedStudies: Study[] = ORIGINAL_PORTFOLIO_STUDIES;

function seedDb(): LocalDb {
  const timestamp = now();

  return {
    studies: seedStudies,
    design_reviews: [
      {
        id: "seed-design-review",
        review_month: "2026-07",
        overall_score: 86,
        recommendation_type: "small refresh",
        recommendations: [
          "Keep the public homepage concise and recruiter-readable.",
          "Feature the strongest AI/HCI and fintech examples above the chronological log.",
          "Review mobile spacing after new studies are approved."
        ],
        preview_changes: [
          "Slightly tighten hero copy.",
          "Show top three high-scoring entries as featured highlights.",
          "Add clearer document links."
        ],
        status: "pending",
        created_at: timestamp,
        approved_at: null
      }
    ],
    maintenance_reports: [
      {
        id: "seed-maintenance",
        report_month: "2026-07",
        broken_links: [],
        duplicate_entries: [],
        confidentiality_flags: [],
        pdf_status: "No generated PDF yet",
        seo_status: "Base metadata configured",
        mobile_status: "Responsive layout ready for verification",
        recommendations: [
          "Generate the first living PDF after approving a new entry.",
          "Keep screenshots private and off public pages."
        ],
        created_at: timestamp
      }
    ],
    notifications: [
      {
        id: id(),
        title: "Workspace initialized",
        message:
          "The local development store includes starter approved entries so the public portfolio has shape before Supabase is connected.",
        type: "system",
        read: false,
        related_study_id: null,
        created_at: timestamp
      }
    ],
    site_settings: [
      {
        id: id(),
        key: "identity",
        value: {
          brandLine: SITE_BRAND_LINE,
          homepageTitle:
            "Pranav Likhi — AI UX Research & Human-AI Interaction Portfolio",
          homepageSubtitle:
            "A living portfolio of AI evaluation, UX research participation, fintech UX, voice and conversational AI, and multilingual product feedback experience.",
          intro:
            "I am building toward a career in AI UX Research and Human-AI Interaction, combining customer experience, product feedback, multilingual communication, and hands-on participation in AI and usability research studies.",
          confidentialityNote: CONFIDENTIALITY_NOTE
        },
        updated_at: timestamp
      },
      {
        id: id(),
        key: "portfolio_categories",
        value: PORTFOLIO_CATEGORIES,
        updated_at: timestamp
      },
      {
        id: id(),
        key: "linkedin_featured_items",
        value: LINKEDIN_FEATURED_ITEMS,
        updated_at: timestamp
      },
      {
        id: id(),
        key: "pdf",
        value: {
          title: PDF_TITLE,
          staticUrl: ORIGINAL_PORTFOLIO_PDF_URL,
          latestUrl: "",
          lastGeneratedAt: ""
        },
        updated_at: timestamp
      },
      {
        id: id(),
        key: "privacy_rules",
        value: {
          neverReveal: [
            "researcher names",
            "study IDs",
            "completion codes",
            "private prototype details",
            "unreleased product details",
            "screenshots publicly"
          ]
        },
        updated_at: timestamp
      }
    ]
  };
}

export async function readLocalDb(): Promise<LocalDb> {
  try {
    const contents = await readFile(DB_PATH, "utf8");
    const db = JSON.parse(contents) as LocalDb;
    const merged = mergeOriginalPortfolioStudies(db);
    if (merged.changed) {
      await writeLocalDb(merged.db);
    }
    return merged.db;
  } catch {
    const db = seedDb();
    await writeLocalDb(db);
    return db;
  }
}

export async function writeLocalDb(db: LocalDb) {
  await mkdir(DB_DIR, { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

function mergeOriginalPortfolioStudies(db: LocalDb) {
  const legacyLocalSeedIds = new Set([
    "seed-ai-assistant",
    "seed-fintech-prototype",
    "seed-multilingual-eval",
    "e95763a5-63b1-4e7a-b1ee-354c1e980d87"
  ]);
  const cleanedStudies = db.studies.filter(
    (study) => !legacyLocalSeedIds.has(study.id)
  );
  const existingIds = new Set(cleanedStudies.map((study) => study.id));
  const missing = ORIGINAL_PORTFOLIO_STUDIES.filter(
    (study) => !existingIds.has(study.id)
  );

  if (!missing.length && cleanedStudies.length === db.studies.length) {
    return { db, changed: false };
  }

  return {
    db: {
      ...db,
      studies: [...missing, ...cleanedStudies]
    },
    changed: true
  };
}
