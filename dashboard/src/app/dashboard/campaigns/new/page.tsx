"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    beneficiary: "",
    goalAmount: "",
    imageUrl: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Musisz być zalogowany");
      setLoading(false);
      return;
    }

    // Get organization
    const { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!organization) {
      setError("Nie znaleziono organizacji");
      setLoading(false);
      return;
    }

    // Create campaign
    const { data: campaign, error: createError } = await supabase
      .from("campaigns")
      .insert({
        organization_id: organization.id,
        title: formData.title,
        description: formData.description || null,
        beneficiary: formData.beneficiary || null,
        goal_amount: parseFloat(formData.goalAmount) || 0,
        current_amount: 0,
        image_url: formData.imageUrl || null,
        status: "active",
      })
      .select()
      .single();

    if (createError) {
      setError(createError.message);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/campaigns/${campaign.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/campaigns"
          className="text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          ← Powrót do zbiórek
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nowa zbiórka</h1>
        <p className="text-gray-600 mt-1">
          Wypełnij formularz, aby utworzyć nową zbiórkę
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Tytuł zbiórki *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="np. Na leczenie Burka"
            />
          </div>

          {/* Beneficiary */}
          <div>
            <label
              htmlFor="beneficiary"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Beneficjent
            </label>
            <input
              id="beneficiary"
              name="beneficiary"
              type="text"
              value={formData.beneficiary}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="np. Burek - 5-letni mieszaniec"
            />
            <p className="text-sm text-gray-500 mt-1">
              Imię zwierzęcia lub opis, dla kogo zbierasz
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Opis
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Opisz cel zbiórki, historię zwierzęcia..."
            />
          </div>

          {/* Goal amount */}
          <div>
            <label
              htmlFor="goalAmount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Cel zbiórki (zł) *
            </label>
            <input
              id="goalAmount"
              name="goalAmount"
              type="number"
              min="1"
              step="1"
              value={formData.goalAmount}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="np. 5000"
            />
          </div>

          {/* Image URL */}
          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              URL zdjęcia
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/zdjecie.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Link do zdjęcia zwierzęcia (opcjonalnie)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/campaigns"
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
          >
            Anuluj
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? "Tworzenie..." : "Utwórz zbiórkę"}
          </button>
        </div>
      </form>
    </div>
  );
}
