export function getDonorsListCode(): string {
  return `
import { addPropertyControls, ControlType } from "framer"
import { useEffect, useState } from "react"

interface Donation {
    id: string
    donor_name: string
    amount: number
    message: string
    is_anonymous: boolean
    created_at: string
}

interface Props {
    campaignId?: string
    apiUrl?: string
    limit?: number
    showAmount?: boolean
    showMessage?: boolean
    showDate?: boolean
    primaryColor?: string
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("pl-PL").format(amount) + " zł"
}

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })
}

function getInitials(name: string): string {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
}

export default function DonorsList({
    campaignId = "",
    apiUrl = "",
    limit = 10,
    showAmount = true,
    showMessage = true,
    showDate = true,
    primaryColor = "#4CAF50",
}: Props) {
    const [donations, setDonations] = useState<Donation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(\`\${apiUrl}/donations?campaign_id=\${campaignId}&limit=\${limit}\`)
            .then(res => res.json())
            .then(data => {
                setDonations(data.donations || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [campaignId, apiUrl, limit])

    if (loading) {
        return <div style={{ padding: 20, textAlign: "center", color: "#666" }}>Ładowanie...</div>
    }

    if (donations.length === 0) {
        return (
            <div style={{
                padding: 40,
                textAlign: "center",
                color: "#666",
                fontFamily: "Inter, sans-serif",
            }}>
                Bądź pierwszym darczyńcą!
            </div>
        )
    }

    return (
        <div style={{ fontFamily: "Inter, sans-serif" }}>
            {donations.map((donation) => {
                const name = donation.is_anonymous ? "Anonim" : (donation.donor_name || "Darczyńca")
                return (
                    <div key={donation.id} style={{
                        display: "flex",
                        gap: 12,
                        padding: "16px 0",
                        borderBottom: "1px solid #f3f4f6",
                    }}>
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: \`\${primaryColor}20\`,
                            color: primaryColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 600,
                            fontSize: 14,
                            flexShrink: 0,
                        }}>
                            {getInitials(name)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontWeight: 600, fontSize: 14 }}>{name}</span>
                                {showAmount && (
                                    <span style={{ fontWeight: 700, color: primaryColor, fontSize: 14 }}>
                                        {formatCurrency(donation.amount)}
                                    </span>
                                )}
                            </div>
                            {showMessage && donation.message && (
                                <p style={{
                                    fontSize: 13,
                                    color: "#666",
                                    margin: "4px 0 0 0",
                                    lineHeight: 1.4,
                                }}>
                                    "{donation.message}"
                                </p>
                            )}
                            {showDate && (
                                <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, display: "block" }}>
                                    {formatDate(donation.created_at)}
                                </span>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

addPropertyControls(DonorsList, {
    campaignId: { type: ControlType.String, title: "Campaign ID", defaultValue: "" },
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    limit: { type: ControlType.Number, title: "Limit", defaultValue: 10, min: 1, max: 50 },
    showAmount: { type: ControlType.Boolean, title: "Show Amount", defaultValue: true },
    showMessage: { type: ControlType.Boolean, title: "Show Message", defaultValue: true },
    showDate: { type: ControlType.Boolean, title: "Show Date", defaultValue: true },
    primaryColor: { type: ControlType.Color, title: "Primary Color", defaultValue: "#4CAF50" },
})
`
}
