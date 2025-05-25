"use client";

import { authClient } from "@/lib/auth";
import { getStripePrices } from "@/lib/stripe";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";
import { TrendingUp } from "lucide-react";
import { StandardPage } from "../../components/StandardPage";
import { useStripeSubscription } from "../settings/subscription/utils/useStripeSubscription";
import { useUserOrganizations } from "../../api/admin/organizations";
import { useGetOrgEventCount } from "../../api/analytics/useGetOrgEventCount";
import { UsageChart } from "../../components/UsageChart";
import { PricingHeader } from "./components/PricingHeader";
import { PricingCard } from "./components/PricingCard";
import { FAQSection } from "./components/FAQSection";

export default function Subscribe() {
  const { data: sessionData } = authClient.useSession();
  const { data: subscription } = useStripeSubscription();
  const { data: organizations } = useUserOrganizations();
  const router = useRouter();

  // Redirect if already subscribed
  if (subscription?.status === "active") {
    router.push("/settings/subscription");
  }

  // Get the first organization
  const organizationId = organizations?.[0]?.id;

  // Get last 30 days of data
  const endDate = DateTime.now().toISODate();
  const startDate = DateTime.now().minus({ days: 30 }).toISODate();

  // Fetch usage data for the chart and total calculation
  const { data: eventCountData } = useGetOrgEventCount({
    organizationId: organizationId || "",
    startDate,
    endDate,
    enabled: !!organizationId,
  });

  // Calculate total events over the past 30 days
  const totalEvents =
    eventCountData?.data?.reduce((sum, day) => sum + day.event_count, 0) || 0;

  return (
    <StandardPage>
      <div className="container mx-auto py-12 px-4">
        <PricingHeader />

        {/* Pricing Card */}
        <PricingCard
          stripePrices={getStripePrices()}
          isLoggedIn={!!sessionData?.user}
        />

        {/* Usage Stats and Chart */}
        {organizationId && (
          <div className="max-w-lg mx-auto mt-6">
            <div className="bg-blue-900/20 rounded-xl border border-blue-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold text-lg">
                  Your Usage (Last 30 Days)
                </h3>
              </div>

              <div className="mb-6">
                <div className="bg-blue-950/50 p-4 rounded-lg inline-block">
                  <p className="text-sm text-neutral-300 mb-1">Total Events</p>
                  <p className="text-3xl font-bold text-blue-300">
                    {totalEvents.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Events tracked in the past 30 days
                  </p>
                </div>
              </div>

              <div className="p-1">
                <UsageChart
                  organizationId={organizationId}
                  startDate={startDate}
                  endDate={endDate}
                />
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-lg mx-auto">
          <FAQSection />
        </div>
      </div>
    </StandardPage>
  );
}
