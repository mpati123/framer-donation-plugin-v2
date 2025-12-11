/**
 * POST /api/webhook
 *
 * Stripe Webhook Handler
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

// Disable body parsing, need raw body for Stripe signature
export const config = {
    api: {
        bodyParser: false,
    },
}

// Helper to get raw body
async function getRawBody(req: VercelRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
    })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    const buf = await getRawBody(req)
    const sig = req.headers["stripe-signature"]

    let event: Stripe.Event

    try {
        if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
            event = stripe.webhooks.constructEvent(
                buf,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            )
        } else {
            // For testing without webhook secret
            event = JSON.parse(buf.toString())
        }
    } catch (err) {
        console.error("Webhook signature verification failed:", err)
        return res.status(400).json({ error: "Invalid signature" })
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
