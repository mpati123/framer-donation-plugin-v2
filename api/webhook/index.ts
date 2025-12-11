/**
 * POST /api/webhook
 *
 * Stripe Webhook Handler
 *
 * For Vercel Serverless Functions, we need to handle the raw body correctly.
 * The signature is computed over the raw request body, so we must not parse it.
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

// Helper to read raw body from request stream
async function getRawBody(req: VercelRequest): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        req.on("data", (chunk: Buffer) => {
            chunks.push(chunk)
        })
        req.on("end", () => {
            resolve(Buffer.concat(chunks))
        })
        req.on("error", reject)
    })
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

    let rawBody: Buffer | string

    // Try multiple approaches to get raw body
    // Approach 1: Check if body is already a Buffer (some Vercel configurations)
    if (Buffer.isBuffer(req.body)) {
        rawBody = req.body
        console.log("Using req.body as Buffer")
    }
    // Approach 2: Check if body is a string
    else if (typeof req.body === "string") {
        rawBody = req.body
        console.log("Using req.body as string")
    }
    // Approach 3: If body is parsed JSON, stringify it back (not ideal but may work)
    else if (req.body && typeof req.body === "object") {
        // This won't work for signature verification - body was already parsed
        // We need to read from the stream instead
        try {
            rawBody = await getRawBody(req)
            console.log("Read raw body from stream, length:", rawBody.length)
        } catch {
            // Stream may be consumed, try stringifying as last resort
            rawBody = JSON.stringify(req.body)
            console.log("WARNING: Using JSON.stringify as fallback - signature will likely fail")
        }
    }
    // Approach 4: Read from stream
    else {
        try {
            rawBody = await getRawBody(req)
            console.log("Read raw body from stream, length:", rawBody.length)
        } catch (err) {
            console.error("Failed to get raw body:", err)
            return res.status(400).json({ error: "Failed to read body" })
        }
    }

    console.log("Signature header:", typeof sig === "string" ? sig.substring(0, 50) + "..." : sig)

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
