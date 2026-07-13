import { beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_RELEASE } from "@/lib/releases/current-release";
import { getReleaseState } from "@/lib/portfolio-operations/releases";
import { release } from "@/tests/factories";

const storeMock = vi.hoisted(() => ({
  createOperationsAuditLog: vi.fn(),
  listReleases: vi.fn(),
  listReleaseViews: vi.fn(),
  upsertRelease: vi.fn(),
  upsertReleaseView: vi.fn()
}));

vi.mock("@/lib/data/store", () => storeMock);

describe("release manifest and state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has a valid source-controlled release manifest", () => {
    expect(CURRENT_RELEASE.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(CURRENT_RELEASE.title).toBe("Portfolio Operations");
    expect(CURRENT_RELEASE.changes.length).toBeGreaterThan(0);
  });

  it("upserts the current release idempotently before reading state", async () => {
    const current = release({ id: "current", version: CURRENT_RELEASE.version });
    storeMock.upsertRelease.mockResolvedValue(current);
    storeMock.listReleases.mockResolvedValue([current]);
    storeMock.listReleaseViews.mockResolvedValue([]);

    const state = await getReleaseState();

    expect(storeMock.upsertRelease).toHaveBeenCalledWith(
      expect.objectContaining({ version: CURRENT_RELEASE.version })
    );
    expect(state.unread).toHaveLength(1);
  });

  it("suppresses dismissed releases from unread state", async () => {
    const current = release({ id: "current" });
    storeMock.upsertRelease.mockResolvedValue(current);
    storeMock.listReleases.mockResolvedValue([current]);
    storeMock.listReleaseViews.mockResolvedValue([
      {
        id: "view-1",
        release_id: "current",
        viewer_key: "primary-admin",
        first_viewed_at: "2026-07-13T10:00:00.000Z",
        last_viewed_at: "2026-07-13T10:00:00.000Z",
        dismissed_at: "2026-07-13T10:00:00.000Z",
        created_at: "2026-07-13T10:00:00.000Z"
      }
    ]);

    const state = await getReleaseState();

    expect(state.unread).toHaveLength(0);
  });

  it("shows newer active releases even after an older one was dismissed", async () => {
    const oldRelease = release({ id: "old", version: "0.1.0" });
    const newRelease = release({ id: "new", version: "0.2.0" });
    storeMock.upsertRelease.mockResolvedValue(newRelease);
    storeMock.listReleases.mockResolvedValue([newRelease, oldRelease]);
    storeMock.listReleaseViews.mockResolvedValue([
      {
        id: "view-old",
        release_id: "old",
        viewer_key: "primary-admin",
        first_viewed_at: "2026-07-13T10:00:00.000Z",
        last_viewed_at: "2026-07-13T10:00:00.000Z",
        dismissed_at: "2026-07-13T10:00:00.000Z",
        created_at: "2026-07-13T10:00:00.000Z"
      }
    ]);

    const state = await getReleaseState();

    expect(state.unread.map((item) => item.id)).toContain("new");
    expect(state.unread.map((item) => item.id)).not.toContain("old");
  });
});
