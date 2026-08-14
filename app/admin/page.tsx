import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export default async function AdminIndexPage() {
  if (!(await isAdminAuthenticated())) {
    return null;
  }
  redirect("/admin/fda-reports");
}
