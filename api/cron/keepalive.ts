import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

/**
 * Keepalive cron job to prevent Supabase free tier from pausing
 * Run daily via Vercel cron or external service
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Simple query to keep the database active
    const { count, error } = await supabase
      .from("licenses")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Keepalive query failed:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Database is alive",
      licenses_count: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Keepalive error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
