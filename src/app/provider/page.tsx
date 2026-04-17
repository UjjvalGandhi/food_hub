import { headers } from "next/headers";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { UserRole } from "@/models/User";
import { DashboardSmartSuggestions } from "@/components/dashboard/DashboardSmartSuggestions";
import { ProviderReviewInsights } from "@/components/provider/ProviderReviewInsights";

export default async function ProviderDashboardPage() {
  const headersList = await headers();
  const userName = headersList.get("x-user-id") ?? "Provider";

  return (
    <DashboardLayout
      role={UserRole.PROVIDER}
      userName={userName}
      heading="Provider Portal"
      description="Manage your restaurant listings, menu items, and incoming orders."
      icon="🍳"
    >
      <DashboardSmartSuggestions />
      <ProviderReviewInsights />
    </DashboardLayout>
  );
}
