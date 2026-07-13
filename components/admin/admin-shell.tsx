import Link from "next/link";
import { NotificationBell } from "@/components/admin/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Notification } from "@/lib/types";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/upload", label: "Upload" },
  { href: "/admin/manual", label: "Manual" },
  { href: "/admin/design-review", label: "Design Review" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/settings", label: "Settings" }
];

export function AdminShell({
  children,
  notifications
}: {
  children: React.ReactNode;
  notifications: Notification[];
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/88 backdrop-blur-xl dark:border-white/10 dark:bg-[#131818]/88">
        <div className="container-page flex min-h-16 items-center justify-between gap-4">
          <Link href="/admin" className="font-black text-ink dark:text-paper">
            Living AI UX Portfolio OS
          </Link>
          <div className="flex items-center gap-2">
            <Link className="btn-secondary hidden sm:inline-flex" href="/">
              Public site
            </Link>
            <ThemeToggle />
            <NotificationBell notifications={notifications} />
          </div>
        </div>
        <nav className="container-page flex gap-2 overflow-x-auto pb-3">
          {links.map((link) => (
            <Link className="tag shrink-0" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
