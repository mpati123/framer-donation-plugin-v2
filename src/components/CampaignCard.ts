export function getCampaignCardCode(): string {
  return `
import { addPropertyControls, ControlType } from "framer"
import { useEffect, useState } from "react"

interface Campaign {
    id: string
    title: string
    description: string
    excerpt: string
    image_url: string
    goal_amount: number
    collected_amount: number
    donations_count: number
    beneficiary: string
}

interface Props {
    campaignId?: string
    apiUrl?: string
    showImage?: boolean
    showDescription?: boolean
    showProgress?: boolean
    showButton?: boolean
    buttonText?: string
    primaryColor?: string
    borderRadius?: number
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("pl-PL").format(amount) + " zł"
}

export default function CampaignCard({
    campaignId = "",
    apiUrl = "",
    showImage = true,
    showDescription = true,
    showProgress = true,
    showButton = true,
    buttonText = "Wesprzyj",
    primaryColor = "#e74c3c",
    borderRadius = 16,
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
            <div style={{
                width: "100%",
                minHeight: 300,
                background: "#f3f4f6",
                borderRadius,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}>
                Ładowanie...
            </div>
        )
    }

    if (!campaign) {
        return <div style={{ color: "#ef4444" }}>Nie znaleziono zbiórki</div>
    }

    const percentage = Math.round((campaign.collected_amount / campaign.goal_amount) * 100)

    return (
        <div style={{
            width: "100%",
            background: "#fff",
            borderRadius,
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            fontFamily: "Inter, sans-serif",
        }}>
            {showImage && campaign.image_url && (
                <div style={{
                    width: "100%",
                    height: 200,
                    backgroundImage: \`url(\${campaign.image_url})\`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }} />
            )}

            <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{campaign.title}</h3>

                {campaign.beneficiary && (
                    <p style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>
                        Dla: {campaign.beneficiary}
                    </p>
                )}

                {showDescription && (campaign.excerpt || campaign.description) && (
                    <p style={{ fontSize: 14, color: "#444", lineHeight: 1.5, marginBottom: 16 }}>
                        {campaign.excerpt || campaign.description?.substring(0, 150)}...
                    </p>
                )}

                {showProgress && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 14,
                            marginBottom: 8,
                        }}>
                            <span style={{ fontWeight: 700 }}>{formatCurrency(campaign.collected_amount)}</span>
                            <span style={{ color: "#666" }}>z {formatCurrency(campaign.goal_amount)}</span>
                        </div>
                        <div style={{
                            height: 8,
                            background: "#e5e7eb",
                            borderRadius: 4,
                            overflow: "hidden",
                        }}>
                            <div style={{
                                height: "100%",
                                width: \`\${Math.min(percentage, 100)}%\`,
                                background: primaryColor,
                                borderRadius: 4,
                            }} />
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            color: "#666",
                            marginTop: 8,
                        }}>
                            <span style={{ color: primaryColor, fontWeight: 600 }}>{percentage}%</span>
                            <span>{campaign.donations_count} darczyńców</span>
                        </div>
                    </div>
                )}

                {showButton && (
                    <button style={{
                        width: "100%",
                        padding: "14px 24px",
                        background: primaryColor,
                        color: "#fff",
                        border: "none",
                        borderRadius: 30,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                    }}>
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    )
}

addPropertyControls(CampaignCard, {
    campaignId: { type: ControlType.String, title: "Campaign ID", defaultValue: "" },
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    showImage: { type: ControlType.Boolean, title: "Show Image", defaultValue: true },
    showDescription: { type: ControlType.Boolean, title: "Show Description", defaultValue: true },
    showProgress: { type: ControlType.Boolean, title: "Show Progress", defaultValue: true },
    showButton: { type: ControlType.Boolean, title: "Show Button", defaultValue: true },
    buttonText: { type: ControlType.String, title: "Button Text", defaultValue: "Wesprzyj" },
    primaryColor: { type: ControlType.Color, title: "Primary Color", defaultValue: "#e74c3c" },
    borderRadius: { type: ControlType.Number, title: "Radius", defaultValue: 16, min: 0, max: 32 },
})
`
}
