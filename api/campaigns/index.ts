/**
 * /api/campaigns
 *
 * GET - Lista wszystkich zbiórek
 * POST - Tworzenie nowej zbiórki (wymaga autoryzacji)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

// Public client for read operations
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
)

// Admin client for write operations
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple API key auth for admin operations
function isAuthorized(req: VercelRequest): boolean {
    const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "")
    return apiKey === process.env.ADMIN_API_KEY
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    try {
        // GET - Lista kampanii
        if (req.method === "GET") {
            return handleGet(req, res)
        }

        // POST - Tworzenie kampanii
        if (req.method === "POST") {
            if (!isAuthorized(req)) {
                return res.status(401).json({ error: "Unauthorized" })
            }
            return handlePost(req, res)
        }

        return res.status(405).json({ error: "Method not allowed" })
    } catch (err) {
        console.error("Error:", err)
        return res.status(500).json({ error: "Internal server error" })
    }
}

/**
 * GET /api/campaigns
 * Query params:
 * - status: "active" | "inactive" | "archived" | "all" (default: "active")
 * - limit: number (default: 10)
 * - offset: number (default: 0)
 */
async function handleGet(req: VercelRequest, res: VercelResponse) {
    const { status = "active", limit = 10, offset = 0 } = req.query
    const isAdmin = isAuthorized(req)

    // Use admin client if authorized (to see all campaigns including archived)
    const client = isAdmin ? supabaseAdmin : supabase

    let query = client
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .range(Number(offset), Number(offset) + Number(limit) - 1)

    // Filter by status
    if (status === "active") {
        query = query.eq("is_active", true).is("archived_at", null)
    } else if (status === "inactive") {
        query = query.eq("is_active", false).is("archived_at", null)
    } else if (status === "archived") {
        if (!isAdmin) {
            return res.status(403).json({ error: "Archived campaigns require authorization" })
        }
        query = query.not("archived_at", "is", null)
    } else if (status === "all") {
        if (!isAdmin) {
            // Non-admin can only see non-archived
            query = query.is("archived_at", null)
        }
        // Admin sees everything
    }

    const { data, error } = await query

    if (error) {
        console.error("Supabase error:", error)
        return res.status(500).json({ error: "Database error" })
    }

    // Calculate percentage for each campaign
    const campaigns = (data || []).map((campaign) => ({
        ...campaign,
        percentage: campaign.goal_amount > 0
            ? Math.round((campaign.collected_amount / campaign.goal_amount) * 100)
            : 0,
    }))

    return res.status(200).json({ campaigns, total: campaigns.length })
}

/**
 * POST /api/campaigns
 * Body: { title, description, goal_amount, ... }
 */
async function handlePost(req: VercelRequest, res: VercelResponse) {
    const {
        title,
        description,
        excerpt,
        image_url,
        beneficiary,
        goal_amount,
        end_date,
        progress_style = "default",
        progress_color = "#4CAF50",
        show_donors = true,
        slug,
    } = req.body

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
        return res.status(400).json({ error: "Title is required" })
    }

    if (!goal_amount || typeof goal_amount !== "number" || goal_amount <= 0) {
        return res.status(400).json({ error: "Goal amount must be a positive number" })
    }

    // Generate slug if not provided
    const campaignSlug = slug || title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

    // Check if slug is unique
    const { data: existingCampaign } = await supabaseAdmin
        .from("campaigns")
        .select("id")
        .eq("slug", campaignSlug)
        .single()

    if (existingCampaign) {
        return res.status(400).json({ error: "Campaign with this slug already exists" })
    }

    // Insert campaign
    const { data, error } = await supabaseAdmin
        .from("campaigns")
        .insert({
            title: title.trim(),
            description: description?.trim() || null,
            excerpt: excerpt?.trim() || null,
            image_url: image_url || null,
            beneficiary: beneficiary?.trim() || null,
            goal_amount,
            end_date: end_date || null,
            progress_style,
            progress_color,
            show_donors,
            slug: campaignSlug,
            is_active: true,
            collected_amount: 0,
            donations_count: 0,
        })
        .select()
        .single()

    if (error) {
        console.error("Supabase error:", error)
        return res.status(500).json({ error: "Failed to create campaign" })
    }

    return res.status(201).json({
        message: "Campaign created successfully",
        campaign: {
            ...data,
            percentage: 0,
        },
    })
}
