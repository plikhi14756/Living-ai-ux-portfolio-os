import { SettingsForm } from "@/components/forms/settings-form";
import {
  CONFIDENTIALITY_NOTE,
  SITE_BRAND_LINE
} from "@/lib/constants";
import { getSetting } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings"
};

export default async function AdminSettingsPage() {
  const [identity, aiRules, privacyRules, notificationSettings, pdfSettings] =
    await Promise.all([
      getSetting<Record<string, string>>("identity"),
      getSetting("ai_rules"),
      getSetting("privacy_rules"),
      getSetting("notification_settings"),
      getSetting("pdf_style_settings")
    ]);

  return (
    <div className="space-y-6">
      <section>
        <p className="eyebrow">Settings</p>
        <h1 className="mt-2 text-4xl font-black">Site identity, rules, and exports</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink/70 dark:text-paper/70">
          Control the public positioning, portfolio categories, AI rules,
          privacy rules, notification settings, and PDF style settings.
        </p>
      </section>
      <SettingsForm
        identity={{
          brandLine: SITE_BRAND_LINE,
          homepageTitle:
            "Pranav Likhi — AI UX Research & Human-AI Interaction Portfolio",
          homepageSubtitle:
            "A living portfolio of AI evaluation, UX research participation, fintech UX, voice and conversational AI, and multilingual product feedback experience.",
          intro:
            "I am building toward a career in AI UX Research and Human-AI Interaction, combining customer experience, product feedback, multilingual communication, and hands-on participation in AI and usability research studies.",
          confidentialityNote: CONFIDENTIALITY_NOTE,
          ...(identity ?? {})
        }}
        aiRules={
          aiRules ?? {
            structuredOutput: true,
            unknownFieldsMustRemainUnknown: true,
            approvalRequiredBeforePublishing: true
          }
        }
        privacyRules={
          privacyRules ?? {
            neverReveal: [
              "company names unless public and safe",
              "researcher names",
              "study IDs",
              "completion codes",
              "private prototype details",
              "screenshots publicly"
            ]
          }
        }
        notificationSettings={
          notificationSettings ?? {
            inAppNotifications: true,
            emailNotifications: false
          }
        }
        pdfSettings={
          pdfSettings ?? {
            title: "Living AI UX Portfolio — Pranav Likhi",
            includeExportDate: true,
            includeConfidentialityNote: true
          }
        }
      />
    </div>
  );
}
