import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { PinGate } from "@/components/admin/PinGate";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getPendingCounts } from "@/lib/admin/store";
import { PRODUCT_NAME } from "@/lib/branding";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Admin — ${PRODUCT_NAME}`,
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return <PinGate />;
  }

  const counts = getPendingCounts();
  return (
    <AdminShell fdaPending={counts.fda} communityPending={counts.community}>
      {children}
    </AdminShell>
  );
}
