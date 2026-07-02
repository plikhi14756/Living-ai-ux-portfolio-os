"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";
import type { Notification } from "@/lib/types";

export function NotificationBell({
  notifications
}: {
  notifications: Notification[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const unread = useMemo(() => items.filter((item) => !item.read).length, [items]);

  async function markRead() {
    await fetch("/api/notifications/read", { method: "POST" });
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-secondary h-10 w-10 px-0"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open notifications"
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-ember" />
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-ink/10 bg-white p-3 shadow-soft dark:border-white/10 dark:bg-[#18211f]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-bold">Notifications</p>
            <button
              className="btn-secondary min-h-8 px-2 py-1 text-xs"
              type="button"
              onClick={markRead}
            >
              <CheckCheck size={14} />
              Read
            </button>
          </div>
          <div className="max-h-96 space-y-2 overflow-auto">
            {items.length === 0 ? (
              <p className="text-sm text-ink/60 dark:text-paper/60">
                No notifications yet.
              </p>
            ) : (
              items.map((notification) => (
                <div
                  className="rounded-lg border border-ink/10 p-3 text-sm dark:border-white/10"
                  key={notification.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{notification.title}</p>
                    {!notification.read ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan" />
                    ) : null}
                  </div>
                  <p className="mt-1 leading-5 text-ink/64 dark:text-paper/64">
                    {notification.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
