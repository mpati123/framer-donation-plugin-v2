export function getDonationButtonCode(): string {
  return `
import { addPropertyControls, ControlType } from "framer"
import { useState } from "react"

interface Props {
    campaignId?: string
    apiUrl?: string
    amount?: number
    text?: string
    color?: string
    textColor?: string
    borderRadius?: number
}

export default function DonationButton({
    campaignId = "",
    apiUrl = "",
    amount = 50,
    text = "Wpłać {amount} zł",
    color = "#e74c3c",
    textColor = "#ffffff",
    borderRadius = 30,
}: Props) {
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        setLoading(true)
        try {
            const res = await fetch(\`\${apiUrl}/checkout\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaign_id: campaignId,
                    amount,
                }),
            })
            const data = await res.json()
            if (data.checkout_url) window.location.href = data.checkout_url
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const buttonText = text.replace("{amount}", amount.toString())

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            style={{
                padding: "16px 32px",
                backgroundColor: loading ? "#9ca3af" : color,
                color: textColor,
                border: "none",
                borderRadius,
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: \`0 4px 15px \${color}40\`,
            }}
        >
            {loading ? "..." : buttonText}
        </button>
    )
}

addPropertyControls(DonationButton, {
    campaignId: { type: ControlType.String, title: "Campaign ID", defaultValue: "" },
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    amount: { type: ControlType.Number, title: "Amount", defaultValue: 50, min: 1 },
    text: { type: ControlType.String, title: "Button Text", defaultValue: "Wpłać {amount} zł" },
    color: { type: ControlType.Color, title: "Background", defaultValue: "#e74c3c" },
    textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#ffffff" },
    borderRadius: { type: ControlType.Number, title: "Radius", defaultValue: 30, min: 0, max: 50 },
})
`
}
