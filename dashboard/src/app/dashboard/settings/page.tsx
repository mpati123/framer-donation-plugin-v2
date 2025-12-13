import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function SettingsPage() {
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

  // Get license
  const { data: license } = await supabase
    .from("licenses")
    .select("*")
    .eq("organization_id", organization?.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const stripeConnected = !!organization?.stripe_account_id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ustawienia</h1>
        <p className="text-gray-600 mt-1">
          Zarządzaj ustawieniami swojego konta
        </p>
      </div>

      {/* Organization settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Dane organizacji
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa organizacji
            </label>
            <input
              type="text"
              defaultValue={organization?.name || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Nazwa Twojej organizacji"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email kontaktowy
            </label>
            <input
              type="email"
              defaultValue={organization?.email || user?.email || ""}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="kontakt@organizacja.pl"
            />
          </div>
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Zapisz zmiany
          </button>
        </div>
      </div>

      {/* Stripe Connect */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Połączenie ze Stripe
        </h2>
        {stripeConnected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Stripe połączony</p>
                <p className="text-sm text-gray-500">
                  ID konta: {organization?.stripe_account_id?.slice(0, 10)}...
                </p>
              </div>
            </div>
            <Link
              href="https://dashboard.stripe.com"
              target="_blank"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Otwórz dashboard Stripe →
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              Połącz swoje konto Stripe, aby móc przyjmować wpłaty. Wpłaty
              będą trafiać bezpośrednio na Twoje konto.
            </p>
            <a
              href={`/api/connect/stripe?organization_id=${organization?.id}`}
              className="inline-flex items-center gap-2 bg-[#635BFF] hover:bg-[#4f46e5] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
              </svg>
              Połącz ze Stripe
            </a>
          </div>
        )}
      </div>

      {/* License info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Licencja</h2>
          <Link
            href="/dashboard/settings/billing"
            className="text-primary-500 hover:text-primary-600 text-sm font-medium"
          >
            Zarządzaj płatnościami →
          </Link>
        </div>

        {license ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  license.status === "active"
                    ? "bg-green-100 text-green-700"
                    : license.status === "trial"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {license.status === "active"
                  ? "Aktywna"
                  : license.status === "trial"
                    ? "Trial"
                    : "Wygasła"}
              </span>
              <span className="text-gray-500">
                {license.plan === "yearly" ? "Plan roczny" : "Plan miesięczny"}
              </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Klucz licencji</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-gray-900">
                  {license.license_key}
                </code>
                <button
                  className="text-primary-500 hover:text-primary-600"
                  title="Kopiuj"
                >
                  📋
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                {license.status === "trial" ? "Trial kończy się" : "Odnowienie"}:{" "}
                <span className="font-medium text-gray-900">
                  {new Date(license.current_period_end).toLocaleDateString(
                    "pl-PL",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Brak aktywnej licencji</p>
            <Link
              href="/dashboard/settings/billing"
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Aktywuj licencję
            </Link>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Strefa zagrożenia</h2>
        <p className="text-gray-600 mb-4">
          Te akcje są nieodwracalne. Postępuj ostrożnie.
        </p>
        <div className="flex gap-4">
          <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            Eksportuj dane
          </button>
          <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            Usuń konto
          </button>
        </div>
      </div>
    </div>
  );
}
