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

// Webhook secret for license subscriptions
const webhookSecret = process.env.LICENSE_STRIPE_WEBHOOK_SECRET!;

// Generate license key: DPL-XXXX-XXXX-XXXX
function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "DPL-";
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (j < 2) result += "-";
  }
  return result;
}

// Send welcome email with license key
async function sendWelcomeEmail(email: string, licenseKey: string, plan: string) {
  // Using Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log("Resend API key not configured, skipping email");
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Donations Plugin <hello@yourdomain.com>",
        to: email,
        subject: "🎉 Twój klucz licencyjny - Donations Plugin",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .license-box { background: #f5f5f5; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
              .license-key { font-family: monospace; font-size: 24px; font-weight: bold; color: #e74c3c; letter-spacing: 2px; }
              .steps { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 20px; margin: 20px 0; }
              .step { display: flex; margin: 15px 0; }
              .step-number { background: #e74c3c; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0; }
              .footer { text-align: center; color: #888; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
              .btn { display: inline-block; background: #e74c3c; color: #fff; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🐾 Donations Plugin</h1>
                <p>Dziękujemy za zakup!</p>
              </div>

              <p>Cześć!</p>
              <p>Twoja licencja <strong>${plan === "yearly" ? "roczna" : "miesięczna"}</strong> została aktywowana.</p>

              <div class="license-box">
                <p style="margin: 0 0 10px; color: #666;">Twój klucz licencyjny:</p>
                <div class="license-key">${licenseKey}</div>
              </div>

              <div class="steps">
                <h3 style="margin-top: 0;">📦 Jak aktywować:</h3>
                <div class="step">
                  <div class="step-number">1</div>
                  <div>Otwórz swój projekt we Framer</div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div>Dodaj widget "Donation Widget" lub "Donation Grid"</div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div>W panelu po prawej znajdź pole "License Key"</div>
                </div>
                <div class="step">
                  <div class="step-number">4</div>
                  <div>Wklej powyższy klucz i gotowe! ✅</div>
                </div>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.DASHBOARD_URL || "https://yourdomain.com/dashboard"}" class="btn">
                  Przejdź do panelu
                </a>
              </p>

              <div class="footer">
                <p>Potrzebujesz pomocy? Napisz do nas: <a href="mailto:hello@yourdomain.com">hello@yourdomain.com</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });
    console.log("Welcome email sent to:", email);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    // Get raw body
    const rawBody = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });

    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription" && session.subscription) {
          const email = session.customer_email || session.metadata?.email;
          const plan = session.metadata?.plan || "monthly";

          if (!email) {
            console.error("No email found in session");
            break;
          }

          // Create or get organization
          let { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("email", email.toLowerCase())
            .single();

          if (!org) {
            const { data: newOrg, error } = await supabase
              .from("organizations")
              .insert({
                email: email.toLowerCase(),
                name: email.split("@")[0], // Default name from email
              })
              .select()
              .single();

            if (error || !newOrg) {
              console.error("Failed to create organization:", error);
              break;
            }
            org = newOrg;
          }

          // At this point org is guaranteed to exist
          const organizationId = org!.id;

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Generate unique license key
          let licenseKey = generateLicenseKey();
          let attempts = 0;
          while (attempts < 5) {
            const { data: existing } = await supabase
              .from("licenses")
              .select("id")
              .eq("license_key", licenseKey)
              .single();

            if (!existing) break;
            licenseKey = generateLicenseKey();
            attempts++;
          }

          // Create license
          const { error: licenseError } = await supabase
            .from("licenses")
            .insert({
              organization_id: organizationId,
              license_key: licenseKey,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              plan,
              price_amount: plan === "yearly" ? 499 : 49,
              status: subscription.status === "trialing" ? "trial" : "active",
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            });

          if (licenseError) {
            console.error("Failed to create license:", licenseError);
            break;
          }

          // Send welcome email
          await sendWelcomeEmail(email, licenseKey, plan);

          console.log(`License created: ${licenseKey} for ${email}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Update license dates and status
        const { error } = await supabase
          .from("licenses")
          .update({
            status:
              subscription.status === "active"
                ? "active"
                : subscription.status === "trialing"
                ? "trial"
                : "expired",
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Failed to update license:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Mark license as expired
        const { error } = await supabase
          .from("licenses")
          .update({
            status: "expired",
            cancelled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Failed to expire license:", error);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          // Update license to active (in case it was expired)
          const { error } = await supabase
            .from("licenses")
            .update({
              status: "active",
            })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (error) {
            console.error("Failed to activate license:", error);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          // Mark license as expired after failed payment
          const { error } = await supabase
            .from("licenses")
            .update({
              status: "expired",
            })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (error) {
            console.error("Failed to expire license:", error);
          }

          // TODO: Send payment failed email
        }
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}

// Disable body parsing for webhook (need raw body for signature)
export const config = {
  api: {
    bodyParser: false,
  },
};
