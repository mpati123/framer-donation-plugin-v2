export function getDonationGridCode(): string {
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
    apiUrl?: string
    campaignIds?: string // Comma-separated campaign IDs
    columns?: number
    gap?: number
    // Card options
    showImage?: boolean
    showProgress?: boolean
    showBeneficiary?: boolean
    showDescription?: boolean
    showDonateButton?: boolean
    // Styling
    primaryColor?: string
    borderRadius?: number
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("pl-PL").format(amount) + " zł"
}

export default function DonationGrid({
    apiUrl = "",
    campaignIds = "",
    columns = 2,
    gap = 20,
    showImage = true,
    showProgress = true,
    showBeneficiary = true,
    showDescription = true,
    showDonateButton = true,
    primaryColor = "#e74c3c",
    borderRadius = 16,
}: Props) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!apiUrl) {
            setLoading(false)
            return
        }

        // Parse campaign IDs
        const ids = campaignIds
            .split(",")
            .map(id => id.trim())
            .filter(id => id.length > 0)

        if (ids.length === 0) {
            setLoading(false)
            return
        }

        // Fetch each campaign
        Promise.all(
            ids.map(id =>
                fetch(\`\${apiUrl}/campaigns/\${id}\`)
                    .then(r => r.ok ? r.json() : null)
                    .catch(() => null)
            )
        )
            .then(results => {
                setCampaigns(results.filter(Boolean) as Campaign[])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [apiUrl, campaignIds])

    if (!apiUrl || !campaignIds) {
        return (
            <div style={{
                padding: 40,
                textAlign: "center",
                color: "#999",
                fontFamily: "Inter, sans-serif",
                background: "#f9f9f9",
                borderRadius,
            }}>
                Skonfiguruj API URL i Campaign IDs
            </div>
        )
    }

    if (loading) {
        return (
            <div style={{
                padding: 40,
                textAlign: "center",
                color: "#999",
                fontFamily: "Inter, sans-serif",
            }}>
                Ładowanie zbiórek...
            </div>
        )
    }

    if (campaigns.length === 0) {
        return (
            <div style={{
                padding: 40,
                textAlign: "center",
                color: "#999",
                fontFamily: "Inter, sans-serif",
            }}>
                Brak aktywnych zbiórek
            </div>
        )
    }

    return (
        <div style={{
            fontFamily: "Inter, sans-serif",
            display: "grid",
            gridTemplateColumns: \`repeat(\${columns}, 1fr)\`,
            gap,
        }}>
            {campaigns.map(campaign => {
                const percentage = campaign.goal_amount > 0
                    ? Math.round((campaign.collected_amount / campaign.goal_amount) * 100)
                    : 0

                return (
                    <div
                        key={campaign.id}
                        style={{
                            background: "#fff",
                            borderRadius,
                            overflow: "hidden",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {showImage && campaign.image_url && (
                            <div style={{ backgroundColor: "#f5f5f5" }}>
                                <img
                                    src={campaign.image_url}
                                    alt={campaign.title}
                                    style={{
                                        width: "100%",
                                        height: 180,
                                        objectFit: "cover",
                                        display: "block",
                                    }}
                                />
                            </div>
                        )}
                        <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0" }}>
                                {campaign.title}
                            </h3>
                            {showBeneficiary && campaign.beneficiary && (
                                <p style={{ fontSize: 13, color: primaryColor, margin: "0 0 10px 0" }}>
                                    Dla: {campaign.beneficiary}
                                </p>
                            )}
                            {showDescription && (campaign.excerpt || campaign.description) && (
                                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, margin: "0 0 12px 0", flex: 1 }}>
                                    {(campaign.excerpt || campaign.description || "").substring(0, 100)}...
                                </p>
                            )}
                            {showProgress && (
                                <div style={{ marginTop: "auto" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                                        <span style={{ fontWeight: 700 }}>{formatCurrency(campaign.collected_amount)}</span>
                                        <span style={{ color: "#666" }}>z {formatCurrency(campaign.goal_amount)}</span>
                                    </div>
                                    <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                                        <div style={{
                                            height: "100%",
                                            width: \`\${Math.min(percentage, 100)}%\`,
                                            background: primaryColor,
                                            borderRadius: 4,
                                        }} />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#666" }}>
                                        <span style={{ fontWeight: 600, color: primaryColor }}>{percentage}%</span>
                                        <span>{campaign.donations_count} darczyńców</span>
                                    </div>
                                </div>
                            )}
                            {showDonateButton && (
                                <a
                                    href={\`/zbiorka/\${campaign.id}\`}
                                    style={{
                                        marginTop: 16,
                                        padding: "12px 20px",
                                        backgroundColor: primaryColor,
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 20,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        textAlign: "center",
                                        textDecoration: "none",
                                        display: "block",
                                    }}
                                >
                                    Wesprzyj
                                </a>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

addPropertyControls(DonationGrid, {
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    campaignIds: { type: ControlType.String, title: "Campaign IDs", defaultValue: "", description: "Wklej ID zbiórek oddzielone przecinkami" },
    columns: { type: ControlType.Number, title: "Kolumny", defaultValue: 2, min: 1, max: 4, step: 1 },
    gap: { type: ControlType.Number, title: "Odstęp", defaultValue: 20, min: 0, max: 50 },

    showImage: { type: ControlType.Boolean, title: "Pokaż zdjęcie", defaultValue: true },
    showProgress: { type: ControlType.Boolean, title: "Pokaż postęp", defaultValue: true },
    showBeneficiary: { type: ControlType.Boolean, title: "Pokaż beneficjenta", defaultValue: true },
    showDescription: { type: ControlType.Boolean, title: "Pokaż opis", defaultValue: true },
    showDonateButton: { type: ControlType.Boolean, title: "Przycisk Wesprzyj", defaultValue: true },

    primaryColor: { type: ControlType.Color, title: "Kolor główny", defaultValue: "#e74c3c" },
    borderRadius: { type: ControlType.Number, title: "Zaokrąglenie", defaultValue: 16, min: 0, max: 32 },
})
`
}
