import { headers } from "next/headers";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { UserRole } from "@/models/User";
import { CustomerDashboardHome } from "@/components/dashboard/CustomerDashboardHome";

export default async function CustomerDashboardPage() {
  const headersList = await headers();
  const userName = headersList.get("x-user-id") ?? "Customer"; // ID until /me hydrates name

  return (
    <DashboardLayout
      role={UserRole.CUSTOMER}
      userName={userName}
      heading="My Dashboard"
      description="Browse restaurants, track your orders, and manage your profile."
      icon="🛍️"
    >
      <CustomerDashboardHome />
    </DashboardLayout>
  );
}
