/**
 * POST /api/checkout
 *
 * Tworzy sesję Stripe Checkout
 */

import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
})

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const {
            campaign_id,
            amount,
            donor_name,
            donor_email,
            message = "",
            is_anonymous = false,
        } = req.body

        // Validate required fields
        if (!donor_name || typeof donor_name !== "string" || donor_name.trim().length === 0) {
            return res.status(400).json({ error: "Imię jest wymagane" })
        }

        if (!donor_email || typeof donor_email !== "string" || !donor_email.includes("@")) {
            return res.status(400).json({ error: "Prawidłowy adres email jest wymagany" })
        }

        // Validate campaign
        const { data: campaign, error: campaignError } = await supabase
            .from("campaigns")
            .select("*")
            .eq("id", campaign_id)
            .eq("is_active", true)
            .single()

        if (campaignError || !campaign) {
            return res.status(400).json({ error: "Nie znaleziono aktywnej zbiórki" })
        }

        // Validate amount
        const minAmount = 5
        const donationAmount = parseFloat(amount) || 50

        if (donationAmount < minAmount) {
            return res.status(400).json({
                error: `Minimalna kwota wpłaty to ${minAmount} zł`,
            })
        }

        // Determine payment methods based on currency
        const currency = "pln"
        const paymentMethods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ["card"]

        if (currency === "pln") {
            paymentMethods.push("blik", "p24")
        }

        // Build success/cancel URLs
        // Use FRONTEND_URL env variable for production, fallback to VERCEL_URL for previews
        const baseUrl = process.env.FRONTEND_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

        const successUrl = `${baseUrl}/donation-success?session_id={CHECKOUT_SESSION_ID}`
        const cancelUrl = `${baseUrl}/donation-cancel`

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: paymentMethods,
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: `Darowizna: ${campaign.title}`,
                            description: campaign.beneficiary
                                ? `Dla: ${campaign.beneficiary}`
                                : campaign.excerpt || undefined,
                            images: campaign.image_url ? [campaign.image_url] : [],
                        },
                        unit_amount: Math.round(donationAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: donor_email || undefined,
            metadata: {
                campaign_id,
                campaign_title: campaign.title,
                donor_name,
                donor_email,
                message,
                is_anonymous: is_anonymous ? "true" : "false",
            },
            locale: "pl",
        })

        // Create pending donation record
        const { error: insertError } = await supabase.from("donations").insert({
            campaign_id,
            amount: donationAmount,
            currency: currency.toUpperCase(),
            donor_name,
            donor_email,
            message,
            is_anonymous,
            stripe_session_id: session.id,
            status: "pending",
        })

        if (insertError) {
            console.error("Failed to create donation record:", insertError)
            // Don't fail the checkout - the user can still pay
            // Webhook will need to handle creating the record if it doesn't exist
        } else {
            console.log(`Created pending donation for session ${session.id}`)
        }

        return res.status(200).json({
            checkout_url: session.url,
            session_id: session.id,
        })
    } catch (err) {
        console.error("Checkout error:", err)
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Internal server error",
        })
    }
}
