export function getDonationFormCode(): string {
  return `
import { addPropertyControls, ControlType } from "framer"
import { useState } from "react"

interface Props {
    campaignId?: string
    apiUrl?: string
    amounts?: number[]
    showCustomAmount?: boolean
    showMessage?: boolean
    minAmount?: number
    primaryColor?: string
    buttonText?: string
}

export default function DonationForm({
    campaignId = "",
    apiUrl = "",
    amounts = [20, 50, 100, 200],
    showCustomAmount = true,
    showMessage = true,
    minAmount = 5,
    primaryColor = "#e74c3c",
    buttonText = "Wpłać",
}: Props) {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
    const [customAmount, setCustomAmount] = useState("")
    const [donorName, setDonorName] = useState("")
    const [donorEmail, setDonorEmail] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const currentAmount = customAmount ? parseFloat(customAmount) : selectedAmount

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentAmount || currentAmount < minAmount) {
            setError(\`Minimalna kwota: \${minAmount} zł\`)
            return
        }
        setLoading(true)
        setError(null)

        try {
            const res = await fetch(\`\${apiUrl}/checkout\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaign_id: campaignId,
                    amount: currentAmount,
                    donor_name: donorName,
                    donor_email: donorEmail,
                    message,
                }),
            })
            const data = await res.json()
            if (data.checkout_url) window.location.href = data.checkout_url
            else throw new Error(data.error || "Błąd")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Błąd")
            setLoading(false)
        }
    }

    const inputStyle = {
        width: "100%",
        padding: "12px 16px",
        border: "2px solid #e5e7eb",
        borderRadius: 8,
        fontSize: 15,
        outline: "none",
        boxSizing: "border-box" as const,
    }

    return (
        <form onSubmit={handleSubmit} style={{ width: "100%", fontFamily: "Inter, sans-serif" }}>
            {error && (
                <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 14, marginBottom: 16 }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Wybierz kwotę</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {amounts.map((amount) => (
                        <button
                            key={amount}
                            type="button"
                            onClick={() => { setSelectedAmount(amount); setCustomAmount("") }}
                            style={{
                                padding: "12px 8px",
                                border: \`2px solid \${selectedAmount === amount ? primaryColor : "#e5e7eb"}\`,
                                borderRadius: 8,
                                backgroundColor: selectedAmount === amount ? primaryColor : "#fff",
                                color: selectedAmount === amount ? "#fff" : "#1a1a1a",
                                fontSize: 15,
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            {amount} zł
                        </button>
                    ))}
                </div>
                {showCustomAmount && (
                    <input
                        type="number"
                        placeholder="Inna kwota"
                        value={customAmount}
                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                        style={{ ...inputStyle, marginTop: 12 }}
                        min={minAmount}
                    />
                )}
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Imię (opcjonalnie)</label>
                <input type="text" placeholder="Jan Kowalski" value={donorName} onChange={(e) => setDonorName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Email (opcjonalnie)</label>
                <input type="email" placeholder="jan@example.com" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} style={inputStyle} />
            </div>

            {showMessage && (
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Wiadomość (opcjonalnie)</label>
                    <textarea placeholder="Twoja wiadomość..." value={message} onChange={(e) => setMessage(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                </div>
            )}

            <button
                type="submit"
                disabled={loading || !currentAmount}
                style={{
                    width: "100%",
                    padding: "16px 24px",
                    backgroundColor: loading || !currentAmount ? "#9ca3af" : primaryColor,
                    color: "#fff",
                    border: "none",
                    borderRadius: 30,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: loading || !currentAmount ? "not-allowed" : "pointer",
                }}
            >
                {loading ? "Przekierowuję..." : buttonText}
            </button>
        </form>
    )
}

addPropertyControls(DonationForm, {
    campaignId: { type: ControlType.String, title: "Campaign ID", defaultValue: "" },
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },
    amounts: { type: ControlType.Array, title: "Amounts", control: { type: ControlType.Number }, defaultValue: [20, 50, 100, 200] },
    showCustomAmount: { type: ControlType.Boolean, title: "Custom Amount", defaultValue: true },
    showMessage: { type: ControlType.Boolean, title: "Show Message", defaultValue: true },
    minAmount: { type: ControlType.Number, title: "Min Amount", defaultValue: 5, min: 1 },
    primaryColor: { type: ControlType.Color, title: "Primary Color", defaultValue: "#e74c3c" },
    buttonText: { type: ControlType.String, title: "Button Text", defaultValue: "Wpłać" },
})
`
}
