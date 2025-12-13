/**
 * /api/settings
 *
 * GET - Pobierz ustawienia (publiczne)
 * PUT - Aktualizuj ustawienia (wymaga autoryzacji)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
)

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function isAuthorized(req: VercelRequest): boolean {
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "")
    return apiKey === process.env.ADMIN_API_KEY
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    try {
        if (req.method === "GET") {
            return handleGet(req, res)
        }

        if (req.method === "PUT") {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: "Unauthorized" })
            }
            return handlePut(req, res)
        }

        return res.status(405).json({ error: "Method not allowed" })
    } catch (err) {
        console.error("Error:", err)
        return res.status(500).json({ error: "Internal server error" })
    }
}

async function handleGet(_req: VercelRequest, res: VercelResponse) {
    const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single()

    if (error && error.code !== "PGRST116") {
        console.error("Supabase error:", error)
        return res.status(500).json({ error: "Database error" })
    }

    // Return default settings if none exist
    const settings = data || {
        logo_url: "",
        organization_name: "",
        primary_color: "#e74c3c",
    }

    return res.status(200).json(settings)
}

async function handlePut(req: VercelRequest, res: VercelResponse) {
    const { logo_url, organization_name, primary_color } = req.body

    // Check if settings exist
    const { data: existing } = await supabaseAdmin
        .from("settings")
        .select("id")
        .single()

    let result
    if (existing) {
        // Update existing
        result = await supabaseAdmin
            .from("settings")
            .update({
                logo_url: logo_url || "",
                organization_name: organization_name || "",
                primary_color: primary_color || "#e74c3c",
                updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single()
    } else {
        // Insert new
        result = await supabaseAdmin
            .from("settings")
            .insert({
                logo_url: logo_url || "",
                organization_name: organization_name || "",
                primary_color: primary_color || "#e74c3c",
            })
            .select()
            .single()
    }

    if (result.error) {
        console.error("Supabase error:", result.error)
        return res.status(500).json({ error: "Failed to save settings" })
    }

    return res.status(200).json({
        message: "Settings saved",
        settings: result.data,
    })
}
