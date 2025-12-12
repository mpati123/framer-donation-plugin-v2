/**
 * POST /api/upload
 *
 * Upload image to Supabase Storage
 * Accepts base64 encoded image data
 * Max file size: ~4MB (Vercel limit)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

// Increase body size limit for Vercel
export const config = {
    api: {
        bodyParser: {
            sizeLimit: "10mb",
        },
    },
}

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
        const { image, filename, contentType } = req.body

        if (!image || !filename) {
            return res.status(400).json({ error: "Image and filename are required" })
        }

        // Decode base64 image
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "")
        const buffer = Buffer.from(base64Data, "base64")

        // Generate unique filename
        const ext = filename.split(".").pop() || "jpg"
        const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from("campaign-images")
            .upload(uniqueFilename, buffer, {
                contentType: contentType || "image/jpeg",
                upsert: false,
            })

        if (error) {
            console.error("Upload error:", error)
            return res.status(500).json({ error: error.message })
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("campaign-images")
            .getPublicUrl(uniqueFilename)

        return res.status(200).json({
            url: urlData.publicUrl,
            path: data.path,
        })
    } catch (err) {
        console.error("Upload error:", err)
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Upload failed",
        })
    }
}
