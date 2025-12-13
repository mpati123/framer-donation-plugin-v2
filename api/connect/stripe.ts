import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.LICENSE_STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const supabase = createClient(
  process.env.LICENSE_SUPABASE_URL!,
  process.env.LICENSE_SUPABASE_SERVICE_KEY!
);

const BASE_URL = process.env.BASE_URL || "https://yourdomain.com";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // GET: Start OAuth flow
  if (req.method === "GET") {
    const { license_key, refresh } = req.query;

    if (!license_key) {
      return res.status(400).json({ error: "License key is required" });
    }

    try {
      // Verify license exists
      const { data: license } = await supabase
        .from("licenses")
        .select("organization_id, organizations(id, stripe_account_id)")
        .eq("license_key", (license_key as string).toUpperCase().trim())
        .single();

      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }

      // If organization already has Stripe connected and not refreshing
      if (license.organizations?.stripe_account_id && !refresh) {
        return res.status(200).json({
          connected: true,
          message: "Stripe is already connected",
        });
      }

      // Create Stripe Connect account link
      let accountId = license.organizations?.stripe_account_id;

      if (!accountId) {
        // Create new connected account
        const account = await stripe.accounts.create({
          type: "express",
          country: "PL",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "non_profit", // or "company" / "individual"
        });
        accountId = account.id;

        // Save account ID to organization
        await supabase
          .from("organizations")
          .update({
            stripe_account_id: accountId,
            stripe_account_status: "pending",
          })
          .eq("id", license.organization_id);
      }

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${BASE_URL}/api/connect/stripe?license_key=${license_key}&refresh=true`,
        return_url: `${BASE_URL}/dashboard/settings/stripe?success=true`,
        type: "account_onboarding",
      });

      return res.status(200).json({
        connected: false,
        onboarding_url: accountLink.url,
      });
    } catch (error) {
      console.error("Stripe Connect error:", error);
      return res.status(500).json({
        error: "Failed to create Stripe Connect link",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // POST: Check connection status
  if (req.method === "POST") {
    const { license_key } = req.body;

    if (!license_key) {
      return res.status(400).json({ error: "License key is required" });
    }

    try {
      const { data: license } = await supabase
        .from("licenses")
        .select("organization_id, organizations(id, stripe_account_id, stripe_account_status)")
        .eq("license_key", license_key.toUpperCase().trim())
        .single();

      if (!license || !license.organizations) {
        return res.status(404).json({ error: "License not found" });
      }

      if (!license.organizations.stripe_account_id) {
        return res.status(200).json({
          connected: false,
          status: "not_started",
        });
      }

      // Check account status with Stripe
      const account = await stripe.accounts.retrieve(
        license.organizations.stripe_account_id
      );

      let status: "pending" | "active" | "restricted" = "pending";

      if (account.charges_enabled && account.payouts_enabled) {
        status = "active";
      } else if (account.requirements?.disabled_reason) {
        status = "restricted";
      }

      // Update status in database if changed
      if (status !== license.organizations.stripe_account_status) {
        await supabase
          .from("organizations")
          .update({ stripe_account_status: status })
          .eq("id", license.organization_id);
      }

      return res.status(200).json({
        connected: status === "active",
        status,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        requirements: account.requirements?.currently_due || [],
        business_profile: {
          name: account.business_profile?.name,
          url: account.business_profile?.url,
        },
      });
    } catch (error) {
      console.error("Stripe Connect status error:", error);
      return res.status(500).json({
        error: "Failed to check Stripe Connect status",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
