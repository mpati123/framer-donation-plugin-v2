"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "monthly";

  const [formData, setFormData] = useState({
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    if (formData.password.length < 8) {
      setError("Hasło musi mieć minimum 8 znaków");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // Sign up the user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          organization_name: formData.organizationName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Redirect to Stripe checkout for trial
      const response = await fetch("/api/license/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          organizationName: formData.organizationName,
          plan: plan,
        }),
      });

      const checkoutData = await response.json();

      if (checkoutData.checkoutUrl) {
        window.location.href = checkoutData.checkoutUrl;
      } else {
        // If no checkout needed, go to dashboard
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Utwórz konto
          </h1>
          <p className="text-gray-600">
            Rozpocznij 7-dniowy bezpłatny okres próbny
          </p>
        </div>

        {/* Plan indicator */}
        <div className="bg-primary-50 text-primary-700 px-4 py-3 rounded-lg mb-6 text-center">
          <span className="font-medium">
            {plan === "yearly" ? "Plan roczny" : "Plan miesięczny"}
          </span>
          <span className="mx-2">•</span>
          <span>{plan === "yearly" ? "499 zł/rok" : "49 zł/mies."}</span>
          <p className="text-sm text-primary-600 mt-1">
            Pierwsza płatność po 7-dniowym trialu
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="organizationName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nazwa organizacji / fundacji
            </label>
            <input
              id="organizationName"
              name="organizationName"
              type="text"
              value={formData.organizationName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="np. Fundacja Szczęśliwe Łapy"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="kontakt@fundacja.pl"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Hasło
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Minimum 8 znaków"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Potwierdź hasło
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Powtórz hasło"
            />
          </div>

          <div className="text-sm text-gray-600">
            Rejestrując się, akceptujesz{" "}
            <Link href="/terms" className="text-primary-500 hover:underline">
              Regulamin
            </Link>{" "}
            i{" "}
            <Link href="/privacy" className="text-primary-500 hover:underline">
              Politykę prywatności
            </Link>
            .
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? "Tworzenie konta..." : "Rozpocznij 7-dniowy trial"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          Masz już konto?{" "}
          <Link
            href="/login"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Zaloguj się
          </Link>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <div className="flex justify-center gap-6">
          <span>🔒 Bezpieczne płatności</span>
          <span>💳 Stripe</span>
          <span>🛡️ RODO</span>
        </div>
      </div>
    </div>
  );
}
