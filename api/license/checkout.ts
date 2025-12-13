import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.LICENSE_STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.LICENSE_SUPABASE_URL!,
  process.env.LICENSE_SUPABASE_SERVICE_KEY!
);

interface CheckoutRequest {
  email: string;
  plan: "monthly" | "yearly";
  promoCode?: string;
  successUrl?: string;
  cancelUrl?: string;
}

// Stripe Price IDs - create these in Stripe Dashboard
const PRICE_IDS = {
  monthly: process.env.LICENSE_STRIPE_PRICE_MONTHLY!, // 49 zł/month
  yearly: process.env.LICENSE_STRIPE_PRICE_YEARLY!, // 499 zł/year
};

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
    const {
      email,
      plan,
      promoCode,
      successUrl = process.env.LICENSE_SUCCESS_URL || "https://yourdomain.com/dashboard?success=true",
      cancelUrl = process.env.LICENSE_CANCEL_URL || "https://yourdomain.com/pricing?cancelled=true",
    } = req.body as CheckoutRequest;

    if (!email || !plan) {
      return res.status(400).json({ error: "Email and plan are required" });
    }

    if (!["monthly", "yearly"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    // Check if organization already exists
    let { data: org } = await supabase
      .from("organizations")
      .select("id, email")
      .eq("email", email.toLowerCase().trim())
      .single();

    // Check if they already have an active license
    if (org) {
      const { data: existingLicense } = await supabase
        .from("licenses")
        .select("*")
        .eq("organization_id", org.id)
        .in("status", ["active", "trial"])
        .single();

      if (existingLicense) {
        return res.status(400).json({
          error: "You already have an active license",
          license_key: existingLicense.license_key,
        });
      }
    }

    // Validate promo code if provided
    let stripePromoCodeId: string | undefined;

    if (promoCode) {
      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase().trim())
        .eq("is_active", true)
        .single();

      if (!promo) {
        return res.status(400).json({ error: "Invalid promo code" });
      }

      // Check if promo is still valid
      const now = new Date();
      if (promo.valid_from && new Date(promo.valid_from) > now) {
        return res.status(400).json({ error: "Promo code is not yet active" });
      }
      if (promo.valid_until && new Date(promo.valid_until) < now) {
        return res.status(400).json({ error: "Promo code has expired" });
      }
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        return res.status(400).json({ error: "Promo code usage limit reached" });
      }
      if (promo.applies_to !== "all" && promo.applies_to !== plan) {
        return res.status(400).json({
          error: `This promo code only applies to ${promo.applies_to} plans`,
        });
      }

      // Create Stripe coupon for this promo (if not 100% free)
      if (promo.discount_type === "free") {
        // 100% off - use Stripe's 100% coupon
        const coupon = await stripe.coupons.create({
          percent_off: 100,
          duration: "forever",
          name: `Promo: ${promo.code}`,
        });
        stripePromoCodeId = coupon.id;
      } else if (promo.discount_type === "percent") {
        const coupon = await stripe.coupons.create({
          percent_off: promo.discount_value,
          duration: "once",
          name: `Promo: ${promo.code}`,
        });
        stripePromoCodeId = coupon.id;
      } else if (promo.discount_type === "fixed") {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(promo.discount_value * 100), // Convert to grosze
          currency: "pln",
          duration: "once",
          name: `Promo: ${promo.code}`,
        });
        stripePromoCodeId = coupon.id;
      }

      // Increment promo code usage
      await supabase
        .from("promo_codes")
        .update({ current_uses: promo.current_uses + 1 })
        .eq("id", promo.id);
    }

    // Create or get Stripe customer
    let customerId: string;
    const customers = await stripe.customers.list({ email, limit: 1 });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
    }

    // Create Stripe Checkout Session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card", "p24"],
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 7, // 7-day trial with card authorization
        metadata: {
          plan,
          promo_code: promoCode || "",
        },
      },
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        email,
        plan,
        promo_code: promoCode || "",
      },
      allow_promotion_codes: !stripePromoCodeId, // Allow Stripe promo codes if no custom one
    };

    // Apply discount if we have one
    if (stripePromoCodeId) {
      sessionConfig.discounts = [{ coupon: stripePromoCodeId }];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("License checkout error:", error);
    return res.status(500).json({
      error: "Failed to create checkout session",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
