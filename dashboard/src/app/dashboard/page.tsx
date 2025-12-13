import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get organization
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("user_id", user?.id)
    .single();

  // Get campaigns with stats
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", organization?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get recent donations
  const { data: recentDonations } = await supabase
    .from("donations")
    .select("*, campaigns(title)")
    .eq("organization_id", organization?.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);

  // Calculate stats
  const { data: stats } = await supabase
    .from("donations")
    .select("amount")
    .eq("organization_id", organization?.id)
    .eq("status", "completed");

  const totalRaised = stats?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  const totalDonations = stats?.length || 0;
  const activeCampaigns =
    campaigns?.filter((c) => c.status === "active").length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Witaj, {organization?.name || "Użytkowniku"}!
        </h1>
        <p className="text-gray-600 mt-1">
          Oto podsumowanie Twoich zbiórek i wpłat
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Zebrano łącznie"
          value={`${totalRaised.toLocaleString("pl-PL")} zł`}
          icon="💰"
          trend={null}
        />
        <StatCard
          label="Liczba wpłat"
          value={totalDonations.toString()}
          icon="💝"
          trend={null}
        />
        <StatCard
          label="Aktywne zbiórki"
          value={activeCampaigns.toString()}
          icon="🎯"
          trend={null}
        />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Szybkie akcje
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <span>➕</span>
            Nowa zbiórka
          </Link>
          <Link
            href="/dashboard/campaigns"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <span>📋</span>
            Zarządzaj zbiórkami
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <span>🔗</span>
            Połącz Stripe
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent donations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Ostatnie wpłaty
            </h2>
            <Link
              href="/dashboard/donations"
              className="text-primary-500 hover:text-primary-600 text-sm font-medium"
            >
              Zobacz wszystkie →
            </Link>
          </div>

          {recentDonations && recentDonations.length > 0 ? (
            <div className="space-y-4">
              {recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {donation.donor_name || "Anonimowy darczyńca"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {donation.campaigns?.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{donation.amount} zł
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(donation.created_at).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">💝</span>
              <p>Brak wpłat</p>
              <p className="text-sm">
                Wpłaty pojawią się tutaj po uruchomieniu zbiórki
              </p>
            </div>
          )}
        </div>

        {/* Active campaigns */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Twoje zbiórki
            </h2>
            <Link
              href="/dashboard/campaigns/new"
              className="text-primary-500 hover:text-primary-600 text-sm font-medium"
            >
              + Nowa zbiórka
            </Link>
          </div>

          {campaigns && campaigns.length > 0 ? (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">
                      {campaign.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        campaign.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {campaign.status === "active" ? "Aktywna" : "Wstrzymana"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      {campaign.current_amount?.toLocaleString("pl-PL") || 0} /{" "}
                      {campaign.goal_amount?.toLocaleString("pl-PL")} zł
                    </span>
                    <span>
                      {Math.round(
                        ((campaign.current_amount || 0) /
                          (campaign.goal_amount || 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((campaign.current_amount || 0) /
                            (campaign.goal_amount || 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">🎯</span>
              <p>Brak zbiórek</p>
              <Link
                href="/dashboard/campaigns/new"
                className="inline-block mt-2 text-primary-500 hover:text-primary-600 font-medium"
              >
                Utwórz pierwszą zbiórkę →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string;
  icon: string;
  trend: { value: number; isPositive: boolean } | null;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? "+" : "-"}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
