import { FdaQueue } from "@/components/admin/FdaQueue";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  getFDAReports,
  getPublishedPlaceOptions,
  hydrateAdminStore,
} from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function FdaReportsPage() {
  await hydrateAdminStore();
  if (!(await isAdminAuthenticated())) {
    return null;
  }

  return (
    <FdaQueue
      reports={getFDAReports("all")}
      publishedPlaces={getPublishedPlaceOptions()}
    />
  );
}
