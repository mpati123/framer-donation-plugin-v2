/**
 * POST /api/webhook
 *
 * Stripe Webhook Handler
 *
 * IMPORTANT: For Vercel, we need to handle raw body correctly.
 * Vercel may buffer the body differently than Next.js.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { buffer } from "micro"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2023-10-16",
})

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

// Disable body parsing for Vercel - this is required for webhook signature verification
export const config = {
    api: {
        bodyParser: false,
    },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    const sig = req.headers["stripe-signature"]

    if (!sig) {
        console.error("No stripe-signature header")
        return res.status(400).json({ error: "No signature" })
    }

    // Get raw body using micro's buffer function - this is the recommended approach for Vercel
    let rawBody: Buffer
    try {
        rawBody = await buffer(req)
    } catch (err) {
        console.error("Failed to get raw body:", err)
        return res.status(400).json({ error: "Failed to read body" })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        console.error("Webhook signature verification failed:", message)
        return res.status(400).json({ error: `Invalid signature: ${message}` })
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session

                // Update donation status
                const { error: updateError } = await supabase
                    .from("donations")
                    .update({
                        status: "completed",
                        stripe_payment_intent: session.payment_intent as string,
                    })
                    .eq("stripe_session_id", session.id)

                if (updateError) {
                    console.error("Failed to update donation:", updateError)
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
