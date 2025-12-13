import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.LICENSE_SUPABASE_URL!,
  process.env.LICENSE_SUPABASE_SERVICE_KEY!
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Donations Plugin <hello@yourdomain.com>";
const DASHBOARD_URL = process.env.DASHBOARD_URL || "https://yourdomain.com/dashboard";

interface License {
  id: string;
  license_key: string;
  current_period_end: string;
  organizations: {
    email: string;
    name: string;
  };
}

type ReminderType = "reminder_7d" | "reminder_3d" | "reminder_2d" | "reminder_1d";

async function sendReminderEmail(
  email: string,
  licenseId: string,
  daysRemaining: number,
  reminderType: ReminderType
) {
  if (!RESEND_API_KEY) {
    console.log("Resend API key not configured, skipping email");
    return;
  }

  // Check if email was already sent
  const { data: existingLog } = await supabase
    .from("email_logs")
    .select("id")
    .eq("license_id", licenseId)
    .eq("email_type", reminderType)
    .single();

  if (existingLog) {
    console.log(`Email ${reminderType} already sent for license ${licenseId}`);
    return;
  }

  const subjects: Record<ReminderType, string> = {
    reminder_7d: "⏰ Twoja licencja wygasa za 7 dni",
    reminder_3d: "⚠️ Zostały 3 dni - Odnów licencję",
    reminder_2d: "⚠️ Zostały 2 dni - Odnów teraz",
    reminder_1d: "🚨 OSTATNI DZIEŃ - Licencja wygasa jutro!",
  };

  const urgencyColors: Record<ReminderType, string> = {
    reminder_7d: "#f59e0b", // amber
    reminder_3d: "#f97316", // orange
    reminder_2d: "#ef4444", // red
    reminder_1d: "#dc2626", // dark red
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .warning-box { background: ${urgencyColors[reminderType]}15; border-left: 4px solid ${urgencyColors[reminderType]}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .warning-title { color: ${urgencyColors[reminderType]}; font-size: 18px; font-weight: bold; margin: 0 0 10px; }
        .btn { display: inline-block; background: #e74c3c; color: #fff !important; padding: 14px 35px; border-radius: 30px; text-decoration: none; font-weight: 600; }
        .footer { text-align: center; color: #888; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐾 Donations Plugin</h1>
        </div>

        <div class="warning-box">
          <p class="warning-title">
            ${daysRemaining === 1 ? "Ostatni dzień!" : `Zostało ${daysRemaining} dni`}
          </p>
          <p style="margin: 0;">
            Twoja licencja na Donations Plugin wygasa ${daysRemaining === 1 ? "jutro" : `za ${daysRemaining} dni`}.
            ${daysRemaining <= 3 ? "Po wygaśnięciu Twój widget przestanie przyjmować wpłaty." : ""}
          </p>
        </div>

        <p>Co się stanie po wygaśnięciu:</p>
        <ul>
          <li>Widget będzie nadal widoczny na Twojej stronie</li>
          <li>Przycisk "Wesprzyj" zostanie <strong>zablokowany</strong></li>
          <li>Formularz wpłat będzie <strong>nieaktywny</strong></li>
          <li>Twoja fundacja <strong>nie będzie mogła otrzymywać wpłat</strong></li>
        </ul>

        <p style="text-align: center; margin: 30px 0;">
          <a href="${DASHBOARD_URL}/settings/billing" class="btn">
            Odnów teraz →
          </a>
        </p>

        <div class="footer">
          <p>Masz pytania? Napisz do nas: <a href="mailto:hello@yourdomain.com">hello@yourdomain.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: email,
        subject: subjects[reminderType],
        html,
      }),
    });

    const data = await response.json();

    // Log email
    await supabase.from("email_logs").insert({
      license_id: licenseId,
      email_type: reminderType,
      status: response.ok ? "sent" : "failed",
      resend_id: data.id,
    });

    console.log(`Sent ${reminderType} to ${email}`);
  } catch (error) {
    console.error(`Failed to send ${reminderType} to ${email}:`, error);

    // Log failed attempt
    await supabase.from("email_logs").insert({
      license_id: licenseId,
      email_type: reminderType,
      status: "failed",
    });
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret (optional but recommended)
  const cronSecret = req.headers["authorization"];
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const now = new Date();
    const results = {
      reminder_7d: 0,
      reminder_3d: 0,
      reminder_2d: 0,
      reminder_1d: 0,
    };

    // Find licenses expiring in 7 days
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in7DaysStart = new Date(in7Days.setHours(0, 0, 0, 0));
    const in7DaysEnd = new Date(in7Days.setHours(23, 59, 59, 999));

    const { data: licenses7d } = await supabase
      .from("licenses")
      .select("id, license_key, current_period_end, organizations(email, name)")
      .eq("status", "active")
      .gte("current_period_end", in7DaysStart.toISOString())
      .lte("current_period_end", in7DaysEnd.toISOString()) as { data: License[] | null };

    for (const license of licenses7d || []) {
      await sendReminderEmail(license.organizations.email, license.id, 7, "reminder_7d");
      results.reminder_7d++;
    }

    // Find licenses expiring in 3 days
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in3DaysStart = new Date(in3Days.setHours(0, 0, 0, 0));
    const in3DaysEnd = new Date(in3Days.setHours(23, 59, 59, 999));

    const { data: licenses3d } = await supabase
      .from("licenses")
      .select("id, license_key, current_period_end, organizations(email, name)")
      .eq("status", "active")
      .gte("current_period_end", in3DaysStart.toISOString())
      .lte("current_period_end", in3DaysEnd.toISOString()) as { data: License[] | null };

    for (const license of licenses3d || []) {
      await sendReminderEmail(license.organizations.email, license.id, 3, "reminder_3d");
      results.reminder_3d++;
    }

    // Find licenses expiring in 2 days
    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const in2DaysStart = new Date(in2Days.setHours(0, 0, 0, 0));
    const in2DaysEnd = new Date(in2Days.setHours(23, 59, 59, 999));

    const { data: licenses2d } = await supabase
      .from("licenses")
      .select("id, license_key, current_period_end, organizations(email, name)")
      .eq("status", "active")
      .gte("current_period_end", in2DaysStart.toISOString())
      .lte("current_period_end", in2DaysEnd.toISOString()) as { data: License[] | null };

    for (const license of licenses2d || []) {
      await sendReminderEmail(license.organizations.email, license.id, 2, "reminder_2d");
      results.reminder_2d++;
    }

    // Find licenses expiring in 1 day
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const in1DayStart = new Date(in1Day.setHours(0, 0, 0, 0));
    const in1DayEnd = new Date(in1Day.setHours(23, 59, 59, 999));

    const { data: licenses1d } = await supabase
      .from("licenses")
      .select("id, license_key, current_period_end, organizations(email, name)")
      .eq("status", "active")
      .gte("current_period_end", in1DayStart.toISOString())
      .lte("current_period_end", in1DayEnd.toISOString()) as { data: License[] | null };

    for (const license of licenses1d || []) {
      await sendReminderEmail(license.organizations.email, license.id, 1, "reminder_1d");
      results.reminder_1d++;
    }

    return res.status(200).json({
      success: true,
      sent: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return res.status(500).json({
      error: "Failed to process reminders",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
