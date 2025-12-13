import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get organization data
  const { data: organization } = await supabase
    .from("organizations")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get license data
  const { data: license } = await supabase
    .from("licenses")
    .select("*")
    .eq("organization_id", organization?.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              <span className="font-bold text-xl">Donations</span>
            </Link>

            <div className="flex items-center gap-4">
              {/* License status badge */}
              {license && (
                <LicenseBadge
                  status={license.status}
                  expiresAt={license.current_period_end}
                />
              )}

              <DashboardNav user={user} organization={organization} />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar + Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <ul className="space-y-1">
                <SidebarLink href="/dashboard" icon="📊">
                  Przegląd
                </SidebarLink>
                <SidebarLink href="/dashboard/campaigns" icon="🎯">
                  Zbiórki
                </SidebarLink>
                <SidebarLink href="/dashboard/donations" icon="💝">
                  Wpłaty
                </SidebarLink>
                <SidebarLink href="/dashboard/settings" icon="⚙️">
                  Ustawienia
                </SidebarLink>
                <SidebarLink href="/dashboard/settings/billing" icon="💳">
                  Płatności
                </SidebarLink>
              </ul>
            </nav>

            {/* License key */}
            {license && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-xs text-gray-500 mb-2">Klucz licencji</p>
                <code className="text-sm font-mono text-gray-700 break-all">
                  {license.license_key}
                </code>
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span>{icon}</span>
        <span>{children}</span>
      </Link>
    </li>
  );
}

function LicenseBadge({
  status,
  expiresAt,
}: {
  status: string;
  expiresAt: string;
}) {
  const daysRemaining = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (status === "trial") {
    return (
      <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
        Trial: {daysRemaining} dni
      </div>
    );
  }

  if (status === "active") {
    if (daysRemaining <= 7) {
      return (
        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
          Wygasa za {daysRemaining} dni
        </div>
      );
    }
    return (
      <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
        Aktywna
      </div>
    );
  }

  if (status === "expired") {
    return (
      <Link
        href="/dashboard/settings/billing"
        className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-100"
      >
        Wygasła - Odnów teraz
      </Link>
    );
  }

  return null;
}
