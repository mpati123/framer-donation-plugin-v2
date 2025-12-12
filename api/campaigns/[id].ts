/**
 * /api/campaigns/:id
 *
 * GET - Pobierz szczegóły zbiórki
 * PUT - Edytuj zbiórkę (wymaga autoryzacji)
 * DELETE - Archiwizuj zbiórkę (wymaga autoryzacji)
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
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    const { id } = req.query

    if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Campaign ID is required" })
    }

    try {
        switch (req.method) {
            case "GET":
                return handleGet(req, res, id)
            case "PUT":
                if (!isAuthorized(req)) {
                    return res.status(401).json({ error: "Unauthorized" })
                }
                return handlePut(req, res, id)
            case "DELETE":
                if (!isAuthorized(req)) {
                    return res.status(401).json({ error: "Unauthorized" })
                }
                return handleDelete(req, res, id)
            default:
                return res.status(405).json({ error: "Method not allowed" })
        }
    } catch (err) {
        console.error("Error:", err)
        return res.status(500).json({ error: "Internal server error" })
    }
}

/**
 * GET /api/campaigns/:id
 */
async function handleGet(req: VercelRequest, res: VercelResponse, id: string) {
    const isAdmin = isAuthorized(req)
    const client = isAdmin ? supabaseAdmin : supabase

    const { data, error } = await client
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !data) {
        return res.status(404).json({ error: "Campaign not found" })
    }

    // Non-admin users cannot see archived campaigns
    if (!isAdmin && data.archived_at) {
        return res.status(404).json({ error: "Campaign not found" })
    }

    const campaign = {
        ...data,
        percentage: data.goal_amount > 0
            ? Math.round((data.collected_amount / data.goal_amount) * 100)
            : 0,
    }

    return res.status(200).json(campaign)
}

/**
 * PUT /api/campaigns/:id
 * Update campaign details
 */
async function handlePut(req: VercelRequest, res: VercelResponse, id: string) {
    // First check if campaign exists
    const { data: existingCampaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, slug")
        .eq("id", id)
        .single()

    if (fetchError || !existingCampaign) {
        return res.status(404).json({ error: "Campaign not found" })
    }

    const {
        title,
        description,
        excerpt,
        image_url,
        images,
        beneficiary,
        goal_amount,
        end_date,
        progress_style,
        progress_color,
        show_donors,
        is_active,
        slug,
    } = req.body

    // Build update object with only provided fields
    const updates: Record<string, any> = {}

    if (title !== undefined) {
        if (typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).json({ error: "Title cannot be empty" })
        }
        updates.title = title.trim()
    }

    if (description !== undefined) updates.description = description?.trim() || null
    if (excerpt !== undefined) updates.excerpt = excerpt?.trim() || null
    if (image_url !== undefined) updates.image_url = image_url || null
    if (images !== undefined) updates.images = Array.isArray(images) ? images : []
    if (beneficiary !== undefined) updates.beneficiary = beneficiary?.trim() || null

    if (goal_amount !== undefined) {
        if (typeof goal_amount !== "number" || goal_amount <= 0) {
            return res.status(400).json({ error: "Goal amount must be a positive number" })
        }
        updates.goal_amount = goal_amount
    }

    if (end_date !== undefined) updates.end_date = end_date || null
    if (progress_style !== undefined) updates.progress_style = progress_style
    if (progress_color !== undefined) updates.progress_color = progress_color
    if (show_donors !== undefined) updates.show_donors = show_donors
    if (is_active !== undefined) updates.is_active = is_active

    if (slug !== undefined && slug !== existingCampaign.slug) {
        // Check if new slug is unique
        const { data: slugCheck } = await supabaseAdmin
            .from("campaigns")
            .select("id")
            .eq("slug", slug)
            .neq("id", id)
            .single()

        if (slugCheck) {
            return res.status(400).json({ error: "Campaign with this slug already exists" })
        }
        updates.slug = slug
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No fields to update" })
    }

    // Update campaign
    const { data, error } = await supabaseAdmin
        .from("campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

    if (error) {
        console.error("Supabase error:", error)
        return res.status(500).json({ error: "Failed to update campaign" })
    }

    return res.status(200).json({
        message: "Campaign updated successfully",
        campaign: {
            ...data,
            percentage: data.goal_amount > 0
                ? Math.round((data.collected_amount / data.goal_amount) * 100)
                : 0,
        },
    })
}

/**
 * DELETE /api/campaigns/:id
 * Soft delete (archive) - sets archived_at timestamp
 * Use query param ?permanent=true for hard delete
 */
async function handleDelete(req: VercelRequest, res: VercelResponse, id: string) {
    const { permanent, restore } = req.query

    // First check if campaign exists
    const { data: existingCampaign, error: fetchError } = await supabaseAdmin
        .from("campaigns")
        .select("id, title, archived_at")
        .eq("id", id)
        .single()

    if (fetchError || !existingCampaign) {
        return res.status(404).json({ error: "Campaign not found" })
    }

    // Restore from archive
    if (restore === "true") {
        if (!existingCampaign.archived_at) {
            return res.status(400).json({ error: "Campaign is not archived" })
        }

        const { error } = await supabaseAdmin
            .from("campaigns")
            .update({ archived_at: null, is_active: true })
            .eq("id", id)

        if (error) {
            console.error("Supabase error:", error)
            return res.status(500).json({ error: "Failed to restore campaign" })
        }

        return res.status(200).json({
            message: "Campaign restored successfully",
            campaign_id: id,
        })
    }

    // Permanent delete
    if (permanent === "true") {
        // Check if there are any donations
        const { count } = await supabaseAdmin
            .from("donations")
            .select("id", { count: "exact", head: true })
            .eq("campaign_id", id)

        if (count && count > 0) {
            return res.status(400).json({
                error: "Cannot permanently delete campaign with donations. Archive it instead.",
                donations_count: count,
            })
        }

        const { error } = await supabaseAdmin
            .from("campaigns")
            .delete()
            .eq("id", id)

        if (error) {
            console.error("Supabase error:", error)
            return res.status(500).json({ error: "Failed to delete campaign" })
        }

        return res.status(200).json({
            message: "Campaign permanently deleted",
            campaign_id: id,
        })
    }

    // Soft delete (archive)
    if (existingCampaign.archived_at) {
        return res.status(400).json({ error: "Campaign is already archived" })
    }

    const { error } = await supabaseAdmin
        .from("campaigns")
        .update({
            archived_at: new Date().toISOString(),
            is_active: false,
        })
        .eq("id", id)

    if (error) {
        console.error("Supabase error:", error)
        return res.status(500).json({ error: "Failed to archive campaign" })
    }

    return res.status(200).json({
        message: "Campaign archived successfully",
        campaign_id: id,
    })
}
