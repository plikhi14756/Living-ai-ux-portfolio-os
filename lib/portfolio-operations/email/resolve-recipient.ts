import { getNotificationPreferences } from "@/lib/data/store";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string | null | undefined) {
  return Boolean(value && EMAIL_PATTERN.test(value));
}

export async function resolveNotificationRecipient() {
  const preferences = await getNotificationPreferences();
  const saved = preferences.notification_email?.trim() ?? "";
  const fallback = process.env.ADMIN_NOTIFICATION_EMAIL?.trim() ?? "";

  if (isValidEmail(saved)) {
    return { recipient: saved, source: "saved_preference" as const, preferences };
  }

  if (isValidEmail(fallback)) {
    return { recipient: fallback, source: "environment_fallback" as const, preferences };
  }

  return { recipient: null, source: "missing" as const, preferences };
}
