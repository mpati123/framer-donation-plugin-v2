import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CampaignsPage() {
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

  // Get all campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", organization?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zbiórki</h1>
          <p className="text-gray-600 mt-1">
            Zarządzaj swoimi zbiórkami i celami
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <span>➕</span>
          Nowa zbiórka
        </Link>
      </div>

      {/* Campaigns list */}
      {campaigns && campaigns.length > 0 ? (
        <div className="grid gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <span className="text-6xl mb-4 block">🎯</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Brak zbiórek
          </h2>
          <p className="text-gray-600 mb-6">
            Utwórz swoją pierwszą zbiórkę, aby rozpocząć zbieranie wpłat
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <span>➕</span>
            Utwórz pierwszą zbiórkę
          </Link>
        </div>
      )}
    </div>
  );
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal_amount: number;
  current_amount: number;
  status: string;
  image_url: string | null;
  created_at: string;
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = Math.round(
    (campaign.current_amount / campaign.goal_amount) * 100
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-48 h-32 md:h-auto bg-gray-100 flex-shrink-0">
          {campaign.image_url ? (
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🎯
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {campaign.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {campaign.description || "Brak opisu"}
              </p>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                campaign.status === "active"
                  ? "bg-green-100 text-green-700"
                  : campaign.status === "completed"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {campaign.status === "active"
                ? "Aktywna"
                : campaign.status === "completed"
                  ? "Zakończona"
                  : "Wstrzymana"}
            </span>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-900">
                {campaign.current_amount.toLocaleString("pl-PL")} zł
              </span>
              <span className="text-gray-500">
                z {campaign.goal_amount.toLocaleString("pl-PL")} zł ({progress}%)
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/campaigns/${campaign.id}`}
              className="text-primary-500 hover:text-primary-600 font-medium text-sm"
            >
              Zarządzaj →
            </Link>
            <Link
              href={`/dashboard/campaigns/${campaign.id}/edit`}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Edytuj
            </Link>
            <button className="text-gray-500 hover:text-gray-700 text-sm">
              Kopiuj ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
