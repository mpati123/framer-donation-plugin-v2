import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for licensing
const supabase = createClient(
  process.env.LICENSE_SUPABASE_URL!,
  process.env.LICENSE_SUPABASE_SERVICE_KEY!
);

interface LicenseVerifyRequest {
  key: string;
  domain?: string;
}

interface LicenseStatus {
  valid: boolean;
  status: "active" | "trial" | "expired" | "locked" | "not_found";
  plan?: string;
  expiresAt?: string;
  daysRemaining?: number;
  organization?: {
    name: string;
    stripeConnected: boolean;
  };
  message?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { key, domain } = req.body as LicenseVerifyRequest;

    if (!key) {
      return res.status(400).json({
        valid: false,
        status: "not_found",
        message: "License key is required",
      } as LicenseStatus);
    }

    // Fetch license with organization data
    const { data: license, error } = await supabase
      .from("licenses")
      .select(`
        *,
        organizations (
          id,
          name,
          email,
          stripe_account_id,
          stripe_account_status
        )
      `)
      .eq("license_key", key.toUpperCase().trim())
      .single();

    if (error || !license) {
      return res.status(200).json({
        valid: false,
        status: "not_found",
        message: "License key not found",
      } as LicenseStatus);
    }

    const now = new Date();
    const periodEnd = license.current_period_end
      ? new Date(license.current_period_end)
      : null;
    const trialEnd = license.trial_ends_at
      ? new Date(license.trial_ends_at)
      : null;

    // Check trial status
    if (license.status === "trial" && trialEnd) {
      if (now > trialEnd) {
        // Trial expired, update status
        await supabase
          .from("licenses")
          .update({ status: "expired" })
          .eq("id", license.id);

        return res.status(200).json({
          valid: false,
          status: "expired",
          message: "Trial period has ended. Please subscribe to continue.",
          expiresAt: trialEnd.toISOString(),
        } as LicenseStatus);
      }

      const daysRemaining = Math.ceil(
        (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return res.status(200).json({
        valid: true,
        status: "trial",
        plan: license.plan,
        expiresAt: trialEnd.toISOString(),
        daysRemaining,
        organization: license.organizations
          ? {
              name: license.organizations.name,
              stripeConnected:
                license.organizations.stripe_account_status === "active",
            }
          : undefined,
      } as LicenseStatus);
    }

    // Check active subscription
    if (license.status === "active" && periodEnd) {
      if (now > periodEnd) {
        // Subscription expired, update status
        await supabase
          .from("licenses")
          .update({ status: "expired" })
          .eq("id", license.id);

        return res.status(200).json({
          valid: false,
          status: "locked",
          message: "Subscription has expired. Please renew to continue.",
          expiresAt: periodEnd.toISOString(),
        } as LicenseStatus);
      }

      const daysRemaining = Math.ceil(
        (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return res.status(200).json({
        valid: true,
        status: "active",
        plan: license.plan,
        expiresAt: periodEnd.toISOString(),
        daysRemaining,
        organization: license.organizations
          ? {
              name: license.organizations.name,
              stripeConnected:
                license.organizations.stripe_account_status === "active",
            }
          : undefined,
      } as LicenseStatus);
    }

    // Handle expired/cancelled status
    if (license.status === "expired" || license.status === "cancelled") {
      return res.status(200).json({
        valid: false,
        status: "locked",
        message: "License has expired. Please renew to continue.",
        expiresAt: periodEnd?.toISOString() || trialEnd?.toISOString(),
      } as LicenseStatus);
    }

    // Default: invalid
    return res.status(200).json({
      valid: false,
      status: "not_found",
      message: "Invalid license status",
    } as LicenseStatus);
  } catch (error) {
    console.error("License verification error:", error);
    return res.status(500).json({
      valid: false,
      status: "not_found",
      message: "Server error during verification",
    } as LicenseStatus);
  }
}
