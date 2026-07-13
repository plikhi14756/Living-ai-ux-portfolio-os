import {
  createOperationsAuditLog,
  listReleases,
  listReleaseViews,
  upsertRelease,
  upsertReleaseView
} from "@/lib/data/store";
import { CURRENT_RELEASE } from "@/lib/releases/current-release";

export const ADMIN_VIEWER_KEY = "primary-admin";

export async function ensureCurrentRelease() {
  try {
    const release = await upsertRelease({
      version: CURRENT_RELEASE.version,
      title: CURRENT_RELEASE.title,
      summary: CURRENT_RELEASE.summary,
      change_items: CURRENT_RELEASE.changes,
      release_type: CURRENT_RELEASE.releaseType,
      published_at: CURRENT_RELEASE.publishedAt,
      deployment_reference: CURRENT_RELEASE.deploymentReference,
      is_active: true
    });
    return release;
  } catch (error) {
    console.error("Release synchronization failed", error);
    return null;
  }
}

export async function getReleaseState() {
  await ensureCurrentRelease();
  const [releases, views] = await Promise.all([
    listReleases(),
    listReleaseViews(ADMIN_VIEWER_KEY)
  ]);
  const dismissed = new Set(
    views.filter((view) => view.dismissed_at).map((view) => view.release_id)
  );
  return {
    releases,
    views,
    unread: releases.filter((release) => release.is_active && !dismissed.has(release.id))
  };
}

export async function markReleaseDismissed(releaseId: string) {
  const view = await upsertReleaseView(releaseId, ADMIN_VIEWER_KEY, {
    dismissed_at: new Date().toISOString()
  });
  await createOperationsAuditLog({
    action: "release_viewed",
    entity_type: "release",
    entity_id: releaseId,
    actor: "admin",
    before_state: null,
    after_state: view,
    metadata: {}
  });
  return view;
}

export async function markReleaseUnread(releaseId: string) {
  const view = await upsertReleaseView(releaseId, ADMIN_VIEWER_KEY, {
    dismissed_at: null
  });
  await createOperationsAuditLog({
    action: "release_marked_unread",
    entity_type: "release",
    entity_id: releaseId,
    actor: "admin",
    before_state: null,
    after_state: view,
    metadata: {}
  });
  return view;
}
