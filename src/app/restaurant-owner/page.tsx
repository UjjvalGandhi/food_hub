import { headers } from "next/headers";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { UserRole } from "@/models/User";

export default async function RestaurantOwnerDashboardPage() {
  const headersList = await headers();
  const userName = headersList.get("x-user-id") ?? "Restaurant Owner";

  return (
    <DashboardLayout
      role={UserRole.PROVIDER}
      userName={userName}
      heading="Restaurant Owner Dashboard"
      description="Manage your restaurant profile, menu items, and incoming orders."
      icon="🍽️"
    />
  );
}
