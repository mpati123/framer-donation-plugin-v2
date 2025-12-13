/**
 * GET /api/donations?campaign_id=xxx
 *
 * Lista wpłat dla zbiórki
 */

import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const { campaign_id, limit = 10 } = req.query

        if (!campaign_id) {
            return res.status(400).json({ error: "Campaign ID is required" })
        }

        const { data, error } = await supabase
            .from("donations")
            .select("id, amount, donor_name, message, created_at, is_anonymous")
            .eq("campaign_id", campaign_id)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(Number(limit))

        if (error) {
            console.error("Supabase error:", error)
            return res.status(500).json({ error: "Database error" })
        }

        // Hide donor name for anonymous donations
        const donations = (data || []).map((donation) => ({
            ...donation,
            donor_name: donation.is_anonymous
                ? "Anonimowy darczyńca"
                : donation.donor_name || "Darczyńca",
        }))

        return res.status(200).json({ donations })
    } catch (err) {
        console.error("Error:", err)
        return res.status(500).json({ error: "Internal server error" })
    }
}
