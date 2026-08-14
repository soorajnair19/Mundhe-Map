import { CommunityQueue } from "@/components/admin/CommunityQueue";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  getCommunityRequests,
  getPublishedPlaceOptions,
} from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function CommunityRequestsPage() {
  if (!(await isAdminAuthenticated())) {
    return null;
  }

  return (
    <CommunityQueue
      requests={getCommunityRequests("all")}
      publishedPlaces={getPublishedPlaceOptions()}
    />
  );
}
