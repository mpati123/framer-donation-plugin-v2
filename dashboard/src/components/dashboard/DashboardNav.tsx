"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface DashboardNavProps {
  user: User;
  organization: {
    name: string;
  } | null;
}

export function DashboardNav({ user, organization }: DashboardNavProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-medium">
          {organization?.name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[150px] truncate">
          {organization?.name || user.email}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {organization?.name || "Moja organizacja"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/settings");
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                ⚙️ Ustawienia
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/settings/billing");
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                💳 Płatności i fakturowanie
              </button>
            </div>

            <div className="border-t border-gray-100 pt-1">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Wyloguj się
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
