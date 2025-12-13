import { createClient } from "@/lib/supabase/server";

export default async function DonationsPage() {
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

  // Get all campaigns for this organization
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title")
    .eq("organization_id", organization?.id);

  const campaignIds = campaigns?.map((c) => c.id) || [];

  // Get donations for all campaigns
  const { data: donations } = await supabase
    .from("donations")
    .select("*, campaigns(title)")
    .in("campaign_id", campaignIds.length > 0 ? campaignIds : ["none"])
    .order("created_at", { ascending: false })
    .limit(100);

  // Calculate stats
  const totalAmount = donations?.reduce((sum, d) => sum + d.amount, 0) || 0;
  const totalCount = donations?.length || 0;
  const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wpłaty</h1>
        <p className="text-gray-600 mt-1">
          Historia wszystkich wpłat na Twoje zbiórki
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Suma wpłat"
          value={`${totalAmount.toLocaleString("pl-PL")} zł`}
          icon="💰"
        />
        <StatCard
          title="Liczba wpłat"
          value={totalCount.toString()}
          icon="📊"
        />
        <StatCard
          title="Średnia wpłata"
          value={`${avgAmount.toLocaleString("pl-PL")} zł`}
          icon="📈"
        />
      </div>

      {/* Donations list */}
      {donations && donations.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Darczyńca
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zbiórka
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kwota
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wiadomość
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {donations.map((donation) => (
                  <DonationRow key={donation.id} donation={donation} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <span className="text-6xl mb-4 block">💝</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Brak wpłat
          </h2>
          <p className="text-gray-600">
            Gdy ktoś wpłaci na Twoją zbiórkę, zobaczysz tutaj historię wpłat
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface Donation {
  id: string;
  amount: number;
  donor_name: string;
  donor_email: string;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  campaigns: {
    title: string;
  } | null;
}

function DonationRow({ donation }: { donation: Donation }) {
  const date = new Date(donation.created_at);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {date.toLocaleDateString("pl-PL")}
        <br />
        <span className="text-gray-500 text-xs">
          {date.toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">
          {donation.is_anonymous ? "Anonimowy darczyńca" : donation.donor_name}
        </div>
        {!donation.is_anonymous && donation.donor_email && (
          <div className="text-sm text-gray-500">{donation.donor_email}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {donation.campaigns?.title || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-semibold text-green-600">
          +{donation.amount.toLocaleString("pl-PL")} zł
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
        {donation.message || "-"}
      </td>
    </tr>
  );
}
