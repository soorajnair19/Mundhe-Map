import { FdaQueue } from "@/components/admin/FdaQueue";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  getFDAReports,
  getPublishedPlaceOptions,
} from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function FdaReportsPage() {
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
