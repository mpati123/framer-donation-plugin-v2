/**
 * /api/version
 *
 * GET - Pobierz aktualną wersję pluginu
 */

import type { VercelRequest, VercelResponse } from "@vercel/node"

// Wersja pluginu - zwiększaj przy każdej aktualizacji komponentów
export const PLUGIN_VERSION = "1.0.0"

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    if (req.method === "GET") {
        return res.status(200).json({
            version: PLUGIN_VERSION,
            updated_at: "2025-12-12",
            changelog: "Dodano obsługę zdjęć w opisie zbiórki ([1], [2] itd.)",
        })
    }

    return res.status(405).json({ error: "Method not allowed" })
}
