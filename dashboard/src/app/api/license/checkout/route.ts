import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.LICENSE_STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const supabase = createClient(
  process.env.LICENSE_SUPABASE_URL!,
  process.env.LICENSE_SUPABASE_SERVICE_KEY!
);

const PRICE_IDS = {
  monthly: process.env.LICENSE_STRIPE_PRICE_MONTHLY!,
  yearly: process.env.LICENSE_STRIPE_PRICE_YEARLY!,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, organizationName, plan = "monthly", promoCode } = body;

    if (!email || !organizationName) {
      return NextResponse.json(
        { error: "Email and organization name are required" },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Check if organization already exists
    let { data: organization } = await supabase
      .from("organizations")
      .select("id")
      .eq("email", email)
      .single();

    // Create organization if doesn't exist
    if (!organization) {
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: organizationName,
          email: email,
        })
        .select()
        .single();

      if (orgError) {
        console.error("Error creating organization:", orgError);
        return NextResponse.json(
          { error: "Failed to create organization" },
          { status: 500 }
        );
      }
      organization = newOrg;
    }

    // Create Stripe checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          organization_id: organization.id,
          plan: plan,
        },
      },
      metadata: {
        organization_id: organization.id,
        organization_name: organizationName,
        plan: plan,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/register?cancelled=true`,
    };

    // Handle promo code
    if (promoCode) {
      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (promo) {
        // Check if promo is valid
        const now = new Date();
        const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
        const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

        if (
          (!validFrom || now >= validFrom) &&
          (!validUntil || now <= validUntil) &&
          (!promo.max_uses || promo.current_uses < promo.max_uses) &&
          (promo.applies_to === "all" || promo.applies_to === plan)
        ) {
          // Create Stripe coupon
          let coupon: Stripe.Coupon;

          if (promo.discount_type === "free") {
            coupon = await stripe.coupons.create({
              percent_off: 100,
              duration: "once",
            });
          } else if (promo.discount_type === "percent") {
            coupon = await stripe.coupons.create({
              percent_off: promo.discount_value,
              duration: "once",
            });
          } else {
            coupon = await stripe.coupons.create({
              amount_off: Math.round(promo.discount_value * 100),
              currency: "pln",
              duration: "once",
            });
          }

          sessionParams.discounts = [{ coupon: coupon.id }];

          // Update promo usage
          await supabase
            .from("promo_codes")
            .update({ current_uses: promo.current_uses + 1 })
            .eq("id", promo.id);
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
