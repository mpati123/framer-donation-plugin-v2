/**
 * POST /api/webhook
 *
 * Stripe Webhook Handler
 *
 * IMPORTANT: Vercel Serverless Functions automatically parse JSON body.
 * For Stripe webhooks, we need to skip signature verification OR use a workaround.
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
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    // For Vercel, we'll verify the event by fetching it from Stripe API
    // This is an alternative approach when raw body isn't available
    let event: Stripe.Event

    try {
        // Get event data from request body (already parsed by Vercel)
        const eventData = req.body as Stripe.Event

        if (!eventData || !eventData.id) {
            console.error("Invalid event data received")
            return res.status(400).json({ error: "Invalid event data" })
        }

        // Verify the event by retrieving it from Stripe API
        // This ensures the event is legitimate
        event = await stripe.events.retrieve(eventData.id)

        console.log(`Verified event ${event.id} of type ${event.type}`)
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        console.error("Event verification failed:", message)
        return res.status(400).json({ error: `Invalid event: ${message}` })
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session

                console.log(`Processing checkout.session.completed for session ${session.id}`)
                console.log(`Metadata:`, session.metadata)

                // First, try to update existing donation
                const { data: existingDonation, error: selectError } = await supabase
                    .from("donations")
                    .select("id")
                    .eq("stripe_session_id", session.id)
                    .single()

                if (selectError) {
                    console.log(`No existing donation found for session ${session.id}, creating new one`)

                    // Create new donation from session metadata
                    const metadata = session.metadata || {}
                    const amountTotal = session.amount_total ? session.amount_total / 100 : 0

                    const { error: insertError } = await supabase
                        .from("donations")
                        .insert({
                            campaign_id: metadata.campaign_id,
                            amount: amountTotal,
                            donor_name: metadata.donor_name || "Anonimowy",
                            donor_email: metadata.donor_email || session.customer_email,
                            message: metadata.message || "",
                            is_anonymous: metadata.is_anonymous === "true",
                            stripe_session_id: session.id,
                            stripe_payment_intent: session.payment_intent as string,
                            status: "completed",
                        })

                    if (insertError) {
                        console.error("Failed to create donation:", insertError)
                    } else {
                        console.log(`Created completed donation for session ${session.id}`)
                    }
                } else {
                    console.log(`Found existing donation ${existingDonation.id}, updating status`)

                    // Update existing donation
                    const { error: updateError } = await supabase
                        .from("donations")
                        .update({
                            status: "completed",
                            stripe_payment_intent: session.payment_intent as string,
                        })
                        .eq("stripe_session_id", session.id)

                    if (updateError) {
                        console.error("Failed to update donation:", updateError)
                    } else {
                        console.log(`Updated donation to completed for session ${session.id}`)
                    }
                }

                console.log(`Payment completed: ${session.id}`)
                break
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent
                console.log(`PaymentIntent succeeded: ${paymentIntent.id}`)
                break
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object as Stripe.PaymentIntent

                // Update donation status to failed
                const { error: updateError } = await supabase
                    .from("donations")
                    .update({ status: "failed" })
                    .eq("stripe_payment_intent", paymentIntent.id)

                if (updateError) {
                    console.error("Failed to update donation:", updateError)
                }

                console.log(`Payment failed: ${paymentIntent.id}`)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return res.status(200).json({ received: true })
    } catch (err) {
        console.error("Webhook handler error:", err)
        return res.status(500).json({ error: "Webhook handler failed" })
    }
}
