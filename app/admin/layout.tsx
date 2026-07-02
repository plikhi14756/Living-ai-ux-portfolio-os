import { AdminShell } from "@/components/admin/admin-shell";
import { listNotifications } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const notifications = await listNotifications();

  return <AdminShell notifications={notifications}>{children}</AdminShell>;
}
