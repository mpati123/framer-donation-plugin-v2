import { createClient } from "@/lib/supabase/server";

export default async function BillingPage() {
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

  const daysRemaining = license
    ? Math.ceil(
        (new Date(license.current_period_end).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Płatności i fakturowanie</h1>
        <p className="text-gray-600 mt-1">
          Zarządzaj subskrypcją i metodami płatności
        </p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Aktualny plan
        </h2>

        {license ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {license.plan === "yearly"
                      ? "Plan roczny"
                      : "Plan miesięczny"}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                </div>
                <p className="text-gray-600">
                  {license.plan === "yearly" ? "499 zł/rok" : "49 zł/mies."}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {license.status === "trial"
                    ? "Trial kończy się za"
                    : "Następna płatność za"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {daysRemaining} dni
                </p>
              </div>
            </div>

            {/* Warning if expiring soon */}
            {daysRemaining <= 7 && license.status !== "expired" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h4 className="font-medium text-amber-800">
                      Licencja wygasa wkrótce
                    </h4>
                    <p className="text-amber-700 text-sm mt-1">
                      {license.status === "trial"
                        ? "Po zakończeniu trialu zostaniesz obciążony zgodnie z wybranym planem."
                        : "Upewnij się, że Twoja metoda płatności jest aktualna."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Expired warning */}
            {license.status === "expired" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <h4 className="font-medium text-red-800">
                      Licencja wygasła
                    </h4>
                    <p className="text-red-700 text-sm mt-1">
                      Widget przestał przyjmować wpłaty. Odnów licencję, aby
                      przywrócić funkcjonalność.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              {license.status === "expired" ? (
                <a
                  href={`/api/license/checkout?organization_id=${organization?.id}&plan=${license.plan}`}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Odnów licencję
                </a>
              ) : (
                <>
                  {license.plan === "monthly" && (
                    <a
                      href={`/api/license/checkout?organization_id=${organization?.id}&plan=yearly&upgrade=true`}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Zmień na plan roczny (oszczędność 89 zł)
                    </a>
                  )}
                  <a
                    href={`/api/stripe/portal?organization_id=${organization?.id}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Zarządzaj subskrypcją
                  </a>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block">💳</span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Brak aktywnej subskrypcji
            </h3>
            <p className="text-gray-600 mb-6">
              Wybierz plan, aby aktywować wszystkie funkcje
            </p>
            <div className="flex justify-center gap-4">
              <a
                href={`/api/license/checkout?organization_id=${organization?.id}&plan=monthly`}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Plan miesięczny - 49 zł
              </a>
              <a
                href={`/api/license/checkout?organization_id=${organization?.id}&plan=yearly`}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Plan roczny - 499 zł
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Metoda płatności
        </h2>
        <p className="text-gray-600 mb-4">
          Zarządzaj swoją metodą płatności przez portal Stripe.
        </p>
        <a
          href={`/api/stripe/portal?organization_id=${organization?.id}`}
          className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
        >
          Otwórz portal płatności →
        </a>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Historia faktur
        </h2>
        <p className="text-gray-600 mb-4">
          Wszystkie faktury są dostępne w portalu Stripe.
        </p>
        <a
          href={`/api/stripe/portal?organization_id=${organization?.id}`}
          className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
        >
          Zobacz faktury →
        </a>
      </div>

      {/* Cancel subscription */}
      {license && license.status !== "expired" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Anuluj subskrypcję
          </h2>
          <p className="text-gray-600 mb-4">
            Jeśli anulujesz subskrypcję, będziesz mógł korzystać z pluginu do
            końca opłaconego okresu. Po tym czasie widget przestanie przyjmować
            wpłaty.
          </p>
          <a
            href={`/api/stripe/portal?organization_id=${organization?.id}`}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Anuluj subskrypcję
          </a>
        </div>
      )}
    </div>
  );
}
