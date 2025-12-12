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

interface Donation {
    id: string
    donor_name: string
    amount: number
    message: string
    is_anonymous: boolean
    created_at: string
}

interface Settings {
    logo_url?: string
    organization_name?: string
    primary_color?: string
}

interface Props {
    apiUrl?: string
    campaignIds?: string
    columns?: number
    gap?: number
    showImage?: boolean
    showProgress?: boolean
    showBeneficiary?: boolean
    showDescription?: boolean
    showDonateButton?: boolean
    // Modal options
    showDonors?: boolean
    donorsLimit?: number
    amounts?: number[]
    minAmount?: number
    privacyPolicyUrl?: string
    privacyPolicyText?: string
    // Styling
    primaryColor?: string
    borderRadius?: number
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

function HeartIcon({ color = "#e74c3c", size = 16 }: { color?: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 4 }}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
    )
}

function CloseIcon({ size = 24 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
    )
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
    // Modal
    showDonors = true,
    donorsLimit = 5,
    amounts = [20, 50, 100, 200],
    minAmount = 5,
    privacyPolicyUrl = "",
    privacyPolicyText = "Wpłacając, wyrażasz zgodę na przetwarzanie danych osobowych zgodnie z polityką prywatności.",
    // Styling
    primaryColor = "#e74c3c",
    borderRadius = 16,
}: Props) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [settings, setSettings] = useState<Settings | null>(null)
    const [loading, setLoading] = useState(true)

    // Modal state
    const [modalCampaign, setModalCampaign] = useState<Campaign | null>(null)
    const [donations, setDonations] = useState<Donation[]>([])
    const [loadingDonations, setLoadingDonations] = useState(false)

    // Form state
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
    const [customAmount, setCustomAmount] = useState("")
    const [donorName, setDonorName] = useState("")
    const [donorEmail, setDonorEmail] = useState("")
    const [message, setMessage] = useState("")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
    const [formLoading, setFormLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!apiUrl) {
            setLoading(false)
            return
        }

        const ids = campaignIds
            .split(",")
            .map(id => id.trim())
            .filter(id => id.length > 0)

        if (ids.length === 0) {
            setLoading(false)
            return
        }

        // Fetch settings
        fetch(\`\${apiUrl}/settings\`).then(r => r.json()).then(setSettings).catch(() => null)

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

    const openModal = async (campaign: Campaign) => {
        setModalCampaign(campaign)
        setError(null)
        resetForm()

        if (showDonors && apiUrl) {
            setLoadingDonations(true)
            try {
                const res = await fetch(\`\${apiUrl}/donations?campaign_id=\${campaign.id}&limit=\${donorsLimit}\`)
                const data = await res.json()
                setDonations(data.donations || [])
            } catch {
                setDonations([])
            }
            setLoadingDonations(false)
        }
    }

    const closeModal = () => {
        setModalCampaign(null)
        setDonations([])
        resetForm()
    }

    const resetForm = () => {
        setSelectedAmount(null)
        setCustomAmount("")
        setDonorName("")
        setDonorEmail("")
        setMessage("")
        setIsAnonymous(false)
        setAcceptedPrivacy(false)
        setError(null)
    }

    const handleDonate = async (amount: number) => {
        if (!modalCampaign) return
        setFormLoading(true)
        setError(null)
        try {
            const res = await fetch(\`\${apiUrl}/checkout\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaign_id: modalCampaign.id,
                    amount,
                    donor_name: donorName,
                    donor_email: donorEmail,
                    message,
                    is_anonymous: isAnonymous,
                }),
            })
            const data = await res.json()
            if (data.checkout_url) window.location.href = data.checkout_url
            else throw new Error(data.error || "Błąd")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Błąd")
            setFormLoading(false)
        }
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const amount = customAmount ? parseFloat(customAmount) : selectedAmount
        if (!amount || amount < minAmount) {
            setError(\`Minimalna kwota: \${minAmount} zł\`)
            return
        }
        if (!donorName.trim()) {
            setError("Imię jest wymagane")
            return
        }
        if (!donorEmail.trim() || !donorEmail.includes("@")) {
            setError("Prawidłowy adres email jest wymagany")
            return
        }
        if (privacyPolicyUrl && !acceptedPrivacy) {
            setError("Musisz zaakceptować politykę prywatności")
            return
        }
        handleDonate(amount)
    }

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

    const inputStyle = {
        width: "100%",
        padding: "12px 16px",
        border: "2px solid #e5e7eb",
        borderRadius: 8,
        fontSize: 15,
        outline: "none",
        boxSizing: "border-box" as const,
    }

    const currentFormAmount = customAmount ? parseFloat(customAmount) : selectedAmount

    return (
        <>
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
                            {showImage && (
                                <div style={{ backgroundColor: "#f5f5f5" }}>
                                    {campaign.image_url ? (
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
                                    ) : (
                                        <div style={{
                                            width: "100%",
                                            height: 180,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            backgroundColor: "#e5e7eb",
                                            color: "#9ca3af",
                                        }}>
                                            {settings?.logo_url ? (
                                                <img
                                                    src={settings.logo_url}
                                                    alt="Logo"
                                                    style={{
                                                        maxWidth: "60%",
                                                        maxHeight: "60%",
                                                        objectFit: "contain",
                                                    }}
                                                />
                                            ) : (
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                                    <polyline points="21 15 16 10 5 21"/>
                                                </svg>
                                            )}
                                        </div>
                                    )}
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
                                    <button
                                        onClick={() => openModal(campaign)}
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
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: 6,
                                        }}
                                    >
                                        <HeartIcon color="#fff" size={14} /> Wesprzyj
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal */}
            {modalCampaign && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: 20,
                    }}
                    onClick={closeModal}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: borderRadius + 8,
                            maxWidth: 500,
                            width: "100%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            position: "relative",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: "20px 24px",
                            borderBottom: "1px solid #e5e7eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            position: "sticky",
                            top: 0,
                            background: "#fff",
                            zIndex: 1,
                        }}>
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{modalCampaign.title}</h3>
                                {modalCampaign.beneficiary && (
                                    <p style={{ fontSize: 13, color: primaryColor, margin: "4px 0 0 0" }}>
                                        Dla: {modalCampaign.beneficiary}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={closeModal}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 8,
                                    color: "#666",
                                    borderRadius: 8,
                                }}
                            >
                                <CloseIcon size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: 24 }}>
                            {/* Progress */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(modalCampaign.collected_amount)}</span>
                                    <span style={{ color: "#666" }}>z {formatCurrency(modalCampaign.goal_amount)}</span>
                                </div>
                                <div style={{ height: 10, background: "#e5e7eb", borderRadius: 5, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        width: \`\${Math.min(Math.round((modalCampaign.collected_amount / modalCampaign.goal_amount) * 100), 100)}%\`,
                                        background: primaryColor,
                                        borderRadius: 5,
                                    }} />
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleFormSubmit}>
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
                                    <input
                                        type="number"
                                        placeholder="Inna kwota"
                                        value={customAmount}
                                        onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null) }}
                                        style={{ ...inputStyle, marginTop: 12 }}
                                        min={minAmount}
                                    />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Imię *</label>
                                    <input type="text" placeholder="Jan Kowalski" value={donorName} onChange={(e) => setDonorName(e.target.value)} style={inputStyle} required />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Email *</label>
                                    <input type="email" placeholder="jan@example.com" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} style={inputStyle} required />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Wiadomość (opcjonalnie)</label>
                                    <textarea placeholder="Twoja wiadomość..." value={message} onChange={(e) => setMessage(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
                                        <input
                                            type="checkbox"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            style={{ width: 18, height: 18, cursor: "pointer" }}
                                        />
                                        <span>Chcę pozostać anonimowy/a</span>
                                    </label>
                                </div>

                                {privacyPolicyUrl && (
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }} onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}>
                                            <input
                                                type="checkbox"
                                                checked={acceptedPrivacy}
                                                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                                style={{ width: 16, height: 16, cursor: "pointer", flexShrink: 0, marginTop: 2 }}
                                            />
                                            <div style={{ fontSize: 11, lineHeight: 1.5, color: "#888" }}>
                                                {privacyPolicyText}{" "}
                                                <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, textDecoration: "underline" }} onClick={(e) => e.stopPropagation()}>
                                                    Polityka prywatności
                                                </a> *
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={formLoading || !currentFormAmount}
                                    style={{
                                        width: "100%",
                                        padding: "16px 24px",
                                        backgroundColor: formLoading || !currentFormAmount ? "#9ca3af" : primaryColor,
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 30,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: formLoading || !currentFormAmount ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                    }}
                                >
                                    <HeartIcon color="#fff" size={16} />
                                    {formLoading ? "Przekierowuję..." : "Wpłać"}
                                </button>
                            </form>

                            {/* Donors List */}
                            {showDonors && (
                                <div style={{ marginTop: 24, borderTop: "1px solid #e5e7eb", paddingTop: 24 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, margin: "0 0 16px 0" }}>Ostatnie wpłaty</h4>
                                    {loadingDonations ? (
                                        <p style={{ color: "#999", fontSize: 13 }}>Ładowanie...</p>
                                    ) : donations.length === 0 ? (
                                        <p style={{ color: "#999", fontSize: 13 }}>Bądź pierwszym darczyńcą!</p>
                                    ) : (
                                        donations.map((donation) => {
                                            const name = donation.is_anonymous ? "Anonimowy Darczyńca" : (donation.donor_name || "Darczyńca")
                                            const initials = donation.is_anonymous ? "❤️" : getInitials(name)
                                            return (
                                                <div key={donation.id} style={{
                                                    display: "flex",
                                                    gap: 12,
                                                    padding: "12px 0",
                                                    borderBottom: "1px solid #f3f4f6",
                                                }}>
                                                    <div style={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: "50%",
                                                        background: \`\${primaryColor}20\`,
                                                        color: primaryColor,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: 600,
                                                        fontSize: donation.is_anonymous ? 18 : 13,
                                                        flexShrink: 0,
                                                    }}>
                                                        {initials}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <span style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center" }}>
                                                                {name}
                                                                <HeartIcon color={primaryColor} size={14} />
                                                            </span>
                                                            <span style={{ fontWeight: 700, color: primaryColor, fontSize: 14 }}>
                                                                {formatCurrency(donation.amount)}
                                                            </span>
                                                        </div>
                                                        {donation.message && !donation.is_anonymous && (
                                                            <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                                                                "{donation.message}"
                                                            </p>
                                                        )}
                                                        <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, display: "block" }}>
                                                            {formatDate(donation.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
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

    showDonors: { type: ControlType.Boolean, title: "Lista darczyńców w modalu", defaultValue: true },
    donorsLimit: { type: ControlType.Number, title: "Limit darczyńców", defaultValue: 5, min: 1, max: 20, hidden: (props) => !props.showDonors },
    amounts: { type: ControlType.Array, title: "Kwoty wpłat", control: { type: ControlType.Number }, defaultValue: [20, 50, 100, 200] },
    minAmount: { type: ControlType.Number, title: "Min. kwota", defaultValue: 5, min: 1 },
    privacyPolicyUrl: { type: ControlType.String, title: "URL polityki prywatności", defaultValue: "" },
    privacyPolicyText: { type: ControlType.String, title: "Tekst zgody", defaultValue: "Wpłacając, wyrażasz zgodę na przetwarzanie danych osobowych zgodnie z polityką prywatności." },

    primaryColor: { type: ControlType.Color, title: "Kolor główny", defaultValue: "#e74c3c" },
    borderRadius: { type: ControlType.Number, title: "Zaokrąglenie", defaultValue: 16, min: 0, max: 32 },
})
`
}
