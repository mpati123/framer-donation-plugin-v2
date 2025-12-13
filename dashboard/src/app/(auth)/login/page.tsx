"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Nieprawidłowy email lub hasło"
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Witaj ponownie
          </h1>
          <p className="text-gray-600">
            Zaloguj się do swojego panelu zarządzania
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="twoj@email.pl"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Hasło
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          Nie masz konta?{" "}
          <Link
            href="/register"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Zarejestruj się
          </Link>
        </div>
      </div>
    </div>
  );
}
