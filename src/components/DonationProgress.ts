export function getDonationProgressCode(): string {
  return `
import { addPropertyControls, ControlType } from "framer"
import { useEffect, useState } from "react"

interface Campaign {
    id: string
    title: string
    goal_amount: number
    collected_amount: number
    donations_count: number
    progress_color: string
}

interface Props {
    campaignId?: string
    apiUrl?: string
    showPercentage?: boolean
    showAmounts?: boolean
    showDonorsCount?: boolean
    color?: string
    height?: number
    borderRadius?: number
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("pl-PL", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount) + " zł"
}

export default function DonationProgress({
    campaignId = "",
    apiUrl = "",
    showPercentage = true,
    showAmounts = true,
    showDonorsCount = true,
    color = "#4CAF50",
    height = 12,
    borderRadius = 6,
}: Props) {
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(\`\${apiUrl}/campaigns/\${campaignId}\`)
            .then(res => res.json())
            .then(data => {
                setCampaign(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [campaignId, apiUrl])

    if (loading) {
        return (
            <div style={{ width: "100%", height, backgroundColor: "#e5e7eb", borderRadius, opacity: 0.5 }} />
        )
    }

    if (!campaign) {
        return <div style={{ color: "#ef4444", fontSize: 14 }}>Nie znaleziono zbiórki</div>
    }

    const percentage = campaign.goal_amount > 0
        ? Math.round((campaign.collected_amount / campaign.goal_amount) * 100)
        : 0

    return (
        <div style={{ width: "100%", fontFamily: "Inter, sans-serif" }}>
            {showAmounts && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(campaign.collected_amount)}</span>
                    <span style={{ color: "#666" }}>z {formatCurrency(campaign.goal_amount)}</span>
                </div>
            )}
            <div style={{ width: "100%", height, backgroundColor: "#e5e7eb", borderRadius, overflow: "hidden" }}>
                <div style={{
                    height: "100%",
                    width: \`\${Math.min(percentage, 100)}%\`,
                    backgroundColor: color,
                    borderRadius,
                    transition: "width 0.8s ease-out",
                }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#666" }}>
                {showPercentage && <span style={{ fontWeight: 600, color }}>{percentage}%</span>}
                {showDonorsCount && <span>{campaign.donations_count} darczyńców</span>}
            </div>
        </div>
    )
}

addPropertyControls(DonationProgress, {
    campaignId: { type: ControlType.String, title: "Campaign ID", defaultValue: "" },
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    showPercentage: { type: ControlType.Boolean, title: "Show %", defaultValue: true },
    showAmounts: { type: ControlType.Boolean, title: "Show Amounts", defaultValue: true },
    showDonorsCount: { type: ControlType.Boolean, title: "Show Donors", defaultValue: true },
    color: { type: ControlType.Color, title: "Bar Color", defaultValue: "#4CAF50" },
    height: { type: ControlType.Number, title: "Height", defaultValue: 12, min: 4, max: 32 },
    borderRadius: { type: ControlType.Number, title: "Radius", defaultValue: 6, min: 0, max: 16 },
})
`
}
