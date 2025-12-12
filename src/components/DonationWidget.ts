export function getDonationWidgetCode(): string {
  return `
import { addPropertyControls, ControlType } from "framer"
import { useEffect, useState, useRef } from "react"

interface Campaign {
    id: string
    title: string
    description: string
    excerpt: string
    image_url: string
    images: string[] // Additional gallery images
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
    campaignId?: string
    apiUrl?: string
    // Visibility toggles
    showCard?: boolean
    showProgress?: boolean
    showForm?: boolean
    showButton?: boolean
    showDonors?: boolean
    // Card options
    showImage?: boolean
    showDescription?: boolean
    showBeneficiary?: boolean
    showSupportButton?: boolean
    showGallery?: boolean
    // Form options
    amounts?: number[]
    showCustomAmount?: boolean
    showMessage?: boolean
    showAnonymousOption?: boolean
    minAmount?: number
    // Privacy policy
    privacyPolicyUrl?: string
    privacyPolicyText?: string
    // Button options
    buttonAmount?: number
    buttonText?: string
    // Donors options
    donorsLimit?: number
    showDonorAmount?: boolean
    showDonorMessage?: boolean
    showDonorDate?: boolean
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

// Heart icon component
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

// Parse description with image placeholders like [1], [2], etc.
function parseDescriptionWithImages(description: string, images: string[]): React.ReactNode[] {
    if (!description) return []

    const parts: React.ReactNode[] = []
    const regex = /\\[(\\d+)\\]/g
    let lastIndex = 0
    let match
    let key = 0

    while ((match = regex.exec(description)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            const textBefore = description.substring(lastIndex, match.index)
            parts.push(
                <span key={key++} style={{ whiteSpace: "pre-wrap" }}>
                    {textBefore}
                </span>
            )
        }

        // Add the image if it exists
        const imageIndex = parseInt(match[1], 10) - 1 // [1] = index 0
        if (images && imageIndex >= 0 && imageIndex < images.length) {
            parts.push(
                <img
                    key={key++}
                    src={images[imageIndex]}
                    alt={\`Zdjęcie \${imageIndex + 1}\`}
                    style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 10,
                        margin: "16px 0",
                        display: "block",
                        cursor: "pointer",
                    }}
                    onClick={() => window.open(images[imageIndex], "_blank")}
                />
            )
        } else {
            // Keep the placeholder if image doesn't exist
            parts.push(<span key={key++}>{match[0]}</span>)
        }

        lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < description.length) {
        parts.push(
            <span key={key++} style={{ whiteSpace: "pre-wrap" }}>
                {description.substring(lastIndex)}
            </span>
        )
    }

    return parts
}

// Get images not used in description (for gallery at the bottom)
function getUnusedImages(description: string, images: string[]): string[] {
    if (!images || images.length === 0) return []
    if (!description) return images

    const usedIndices = new Set<number>()
    const regex = /\\[(\\d+)\\]/g
    let match

    while ((match = regex.exec(description)) !== null) {
        const imageIndex = parseInt(match[1], 10) - 1
        if (imageIndex >= 0 && imageIndex < images.length) {
            usedIndices.add(imageIndex)
        }
    }

    return images.filter((_, index) => !usedIndices.has(index))
}

export default function DonationWidget({
    campaignId = "",
    apiUrl = "",
    // Visibility
    showCard = true,
    showProgress = true,
    showForm = false,
    showButton = false,
    showDonors = false,
    // Card
    showImage = true,
    showDescription = true,
    showBeneficiary = true,
    showSupportButton = true,
    showGallery = true,
    // Form
    amounts = [20, 50, 100, 200],
    showCustomAmount = true,
    showMessage = true,
    showAnonymousOption = true,
    minAmount = 5,
    // Privacy policy
    privacyPolicyUrl = "",
    privacyPolicyText = "Wpłacając, wyrażasz zgodę na przetwarzanie Twoich danych osobowych zgodnie z polityką prywatności i upoważniasz Fundację do przekazania informacji podanych w formularzu osobom, które podejmują decyzje w niniejszej kwestii, a także do przesyłania informacji za pośrednictwem newslettera.",
    // Button
    buttonAmount = 50,
    buttonText = "Wpłać {amount} zł",
    // Donors
    donorsLimit = 5,
    showDonorAmount = true,
    showDonorMessage = true,
    showDonorDate = true,
    // Styling
    primaryColor = "#e74c3c",
    borderRadius = 16,
}: Props) {
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [donations, setDonations] = useState<Donation[]>([])
    const [settings, setSettings] = useState<Settings | null>(null)
    const [loading, setLoading] = useState(true)
    const formRef = useRef<HTMLFormElement>(null)

    // Detail modal state
    const [showDetailModal, setShowDetailModal] = useState(false)

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

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    useEffect(() => {
        if (!campaignId || !apiUrl) {
            setLoading(false)
            return
        }

        Promise.all([
            fetch(\`\${apiUrl}/campaigns/\${campaignId}\`).then(r => r.json()),
            showDonors ? fetch(\`\${apiUrl}/donations?campaign_id=\${campaignId}&limit=\${donorsLimit}\`).then(r => r.json()) : Promise.resolve({ donations: [] }),
            fetch(\`\${apiUrl}/settings\`).then(r => r.json()).catch(() => null)
        ])
        .then(([campaignData, donationsData, settingsData]) => {
            setCampaign(campaignData)
            setDonations(donationsData.donations || [])
            setSettings(settingsData)
            setLoading(false)
        })
        .catch(() => setLoading(false))
    }, [campaignId, apiUrl, donorsLimit, showDonors])

    const handleDonate = async (amount: number) => {
        setFormLoading(true)
        setError(null)
        try {
            const res = await fetch(\`\${apiUrl}/checkout\`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    campaign_id: campaignId,
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

    const handleButtonClick = () => {
        handleDonate(buttonAmount)
    }

    if (!campaignId || !apiUrl) {
        return (
            <div style={{
                padding: 40,
                textAlign: "center",
                color: "#999",
                fontFamily: "Inter, sans-serif",
                background: "#f9f9f9",
                borderRadius,
            }}>
                Skonfiguruj Campaign ID i API URL
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
                Ładowanie...
            </div>
        )
    }

    if (!campaign) {
        return <div style={{ color: "#ef4444", padding: 20 }}>Nie znaleziono zbiórki</div>
    }

    const percentage = campaign.goal_amount > 0
        ? Math.round((campaign.collected_amount / campaign.goal_amount) * 100)
        : 0

    const currentFormAmount = customAmount ? parseFloat(customAmount) : selectedAmount

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
        <div style={{
            fontFamily: "Inter, sans-serif",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            width: "100%",
            maxWidth: 450,
            overflow: "hidden",
        }}>
            {/* Campaign Card */}
            {showCard && (
                <div
                    onClick={() => setShowDetailModal(true)}
                    style={{
                        background: "#fff",
                        borderRadius,
                        overflow: "hidden",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        cursor: "pointer",
                        transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)"
                        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)"
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)"
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"
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
                                        height: "auto",
                                        display: "block",
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: "100%",
                                    height: 200,
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
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                            <polyline points="21 15 16 10 5 21"/>
                                        </svg>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, margin: 0 }}>{campaign.title}</h3>
                        {showBeneficiary && campaign.beneficiary && (
                            <p style={{ fontSize: 14, color: primaryColor, marginBottom: 12, margin: "8px 0 12px 0" }}>
                                Dla: {campaign.beneficiary}
                            </p>
                        )}
                        {/* Progress Bar inside card */}
                        {showProgress && (
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14 }}>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(campaign.collected_amount)}</span>
                                    <span style={{ color: "#666" }}>z {formatCurrency(campaign.goal_amount)}</span>
                                </div>
                                <div style={{ height: 12, background: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        width: \`\${Math.min(percentage, 100)}%\`,
                                        background: primaryColor,
                                        borderRadius: 6,
                                        transition: "width 0.8s ease-out",
                                    }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#666" }}>
                                    <span style={{ fontWeight: 600, color: primaryColor }}>{percentage}%</span>
                                    <span>{campaign.donations_count} darczyńców</span>
                                </div>
                            </div>
                        )}
                        {showSupportButton && showForm && (
                            <button
                                onClick={scrollToForm}
                                style={{
                                    width: "100%",
                                    marginBottom: 16,
                                    padding: "14px 24px",
                                    backgroundColor: primaryColor,
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 25,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8,
                                }}
                            >
                                <HeartIcon color="#fff" size={16} /> Wesprzyj
                            </button>
                        )}
                        {showDescription && (campaign.excerpt || campaign.description) && (
                            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                                {campaign.excerpt || campaign.description?.substring(0, 150)}...
                            </p>
                        )}
                        {/* Image Gallery - Thumbnails */}
                        {showGallery && campaign.images && campaign.images.length > 0 && (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: 8,
                                marginTop: 16,
                            }}>
                                {campaign.images.slice(0, 6).map((imgUrl, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            width: "100%",
                                            paddingBottom: "100%",
                                            position: "relative",
                                            borderRadius: 8,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                        }}
                                        onClick={(e) => { e.stopPropagation(); setShowDetailModal(true) }}
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={\`Zdjęcie \${index + 1}\`}
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Donation Form */}
            {showForm && (
                <form ref={formRef} onSubmit={handleFormSubmit} style={{ background: "#fff", padding: 24, borderRadius, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", width: "100%", maxWidth: "100%", overflow: "hidden", boxSizing: "border-box" as const }}>
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
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Imię *</label>
                        <input type="text" placeholder="Jan Kowalski" value={donorName} onChange={(e) => setDonorName(e.target.value)} style={inputStyle} required />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Email *</label>
                        <input type="email" placeholder="jan@example.com" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} style={inputStyle} required />
                    </div>
                    {showMessage && (
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Wiadomość (opcjonalnie)</label>
                            <textarea placeholder="Twoja wiadomość..." value={message} onChange={(e) => setMessage(e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                        </div>
                    )}
                    {showAnonymousOption && (
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    style={{ width: 18, height: 18, cursor: "pointer" }}
                                />
                                <span>Chcę pozostać anonimowy/a na liście darczyńców</span>
                            </label>
                        </div>
                    )}
                    {privacyPolicyUrl && (
                        <div style={{ marginBottom: 20, width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }} onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}>
                                <input
                                    type="checkbox"
                                    checked={acceptedPrivacy}
                                    onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                    style={{ width: 16, height: 16, cursor: "pointer", flexShrink: 0, marginTop: 2 }}
                                />
                                <div style={{ fontSize: 11, lineHeight: 1.5, color: "#888", flex: 1 }}>
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
                        }}
                    >
                        {formLoading ? "Przekierowuję..." : "Wpłać"}
                    </button>
                </form>
            )}

            {/* Quick Donate Button */}
            {showButton && (
                <button
                    onClick={handleButtonClick}
                    disabled={formLoading}
                    style={{
                        padding: "16px 32px",
                        backgroundColor: formLoading ? "#9ca3af" : primaryColor,
                        color: "#fff",
                        border: "none",
                        borderRadius: 30,
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: formLoading ? "not-allowed" : "pointer",
                        boxShadow: \`0 4px 15px \${primaryColor}40\`,
                    }}
                >
                    {formLoading ? "..." : buttonText.replace("{amount}", buttonAmount.toString())}
                </button>
            )}

            {/* Donors List */}
            {showDonors && donations.length > 0 && (
                <div style={{ background: "#fff", padding: 20, borderRadius, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, margin: "0 0 16px 0" }}>Ostatnie wpłaty</h4>
                    {donations.map((donation) => {
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
                                        {showDonorAmount && (
                                            <span style={{ fontWeight: 700, color: primaryColor, fontSize: 14 }}>
                                                {formatCurrency(donation.amount)}
                                            </span>
                                        )}
                                    </div>
                                    {showDonorMessage && donation.message && !donation.is_anonymous && (
                                        <p style={{ fontSize: 13, color: "#666", margin: "4px 0 0 0", lineHeight: 1.4 }}>
                                            "{donation.message}"
                                        </p>
                                    )}
                                    {showDonorDate && (
                                        <span style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, display: "block" }}>
                                            {formatDate(donation.created_at)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && campaign && (
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
                    onClick={() => setShowDetailModal(false)}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: borderRadius + 8,
                            maxWidth: 600,
                            width: "100%",
                            maxHeight: "90vh",
                            overflow: "auto",
                            position: "relative",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Main Image */}
                        {campaign.image_url ? (
                            <img
                                src={campaign.image_url}
                                alt={campaign.title}
                                style={{
                                    width: "100%",
                                    height: "auto",
                                    maxHeight: "50vh",
                                    objectFit: "contain",
                                    display: "block",
                                    backgroundColor: "#f5f5f5",
                                }}
                            />
                        ) : settings?.logo_url ? (
                            <div style={{
                                width: "100%",
                                height: 200,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "#e5e7eb",
                            }}>
                                <img
                                    src={settings.logo_url}
                                    alt="Logo"
                                    style={{
                                        maxWidth: "50%",
                                        maxHeight: "50%",
                                        objectFit: "contain",
                                    }}
                                />
                            </div>
                        ) : null}

                        {/* Close button */}
                        <button
                            onClick={() => setShowDetailModal(false)}
                            style={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                background: "rgba(255,255,255,0.9)",
                                border: "none",
                                cursor: "pointer",
                                padding: 8,
                                color: "#666",
                                borderRadius: "50%",
                                width: 36,
                                height: 36,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                        >
                            <CloseIcon size={20} />
                        </button>

                        {/* Content */}
                        <div style={{ padding: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px 0" }}>
                                {campaign.title}
                            </h2>

                            {campaign.beneficiary && (
                                <p style={{ fontSize: 14, color: primaryColor, margin: "0 0 16px 0", fontWeight: 500 }}>
                                    Dla: {campaign.beneficiary}
                                </p>
                            )}

                            {/* Progress */}
                            <div style={{ marginBottom: 20, padding: 16, background: "#f9fafb", borderRadius: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 15 }}>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(campaign.collected_amount)}</span>
                                    <span style={{ color: "#666" }}>z {formatCurrency(campaign.goal_amount)}</span>
                                </div>
                                <div style={{ height: 12, background: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        width: \`\${Math.min(percentage, 100)}%\`,
                                        background: primaryColor,
                                        borderRadius: 6,
                                    }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#666" }}>
                                    <span style={{ fontWeight: 600, color: primaryColor }}>{percentage}%</span>
                                    <span>{campaign.donations_count} darczyńców</span>
                                </div>
                            </div>

                            {/* Donate Button */}
                            {showForm && (
                                <button
                                    onClick={() => { setShowDetailModal(false); setTimeout(() => scrollToForm(), 100) }}
                                    style={{
                                        width: "100%",
                                        padding: "16px 24px",
                                        backgroundColor: primaryColor,
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 30,
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: 8,
                                        marginBottom: 24,
                                    }}
                                >
                                    <HeartIcon color="#fff" size={18} /> Wesprzyj zbiórkę
                                </button>
                            )}

                            {/* Full Description with inline images */}
                            {campaign.description && (
                                <div style={{ marginBottom: 24 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#333" }}>
                                        O zbiórce
                                    </h4>
                                    <div style={{
                                        fontSize: 14,
                                        color: "#555",
                                        lineHeight: 1.7,
                                    }}>
                                        {parseDescriptionWithImages(campaign.description, campaign.images || [])}
                                    </div>
                                </div>
                            )}

                            {/* Gallery - only unused images */}
                            {(() => {
                                const unusedImages = getUnusedImages(campaign.description || "", campaign.images || [])
                                return unusedImages.length > 0 && (
                                    <div>
                                        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#333" }}>
                                            Galeria
                                        </h4>
                                        <div style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 10,
                                        }}>
                                            {unusedImages.map((imgUrl, index) => (
                                                <img
                                                    key={index}
                                                    src={imgUrl}
                                                    alt={\`Zdjęcie \${index + 1}\`}
                                                    style={{
                                                        width: "100%",
                                                        height: "auto",
                                                        borderRadius: 10,
                                                        cursor: "pointer",
                                                        display: "block",
                                                    }}
                                                    onClick={() => window.open(imgUrl, "_blank")}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

addPropertyControls(DonationWidget, {
    campaignId: { type: ControlType.String, title: "Campaign ID", defaultValue: "" },
    apiUrl: { type: ControlType.String, title: "API URL", defaultValue: "" },

    showCard: { type: ControlType.Boolean, title: "Karta zbiórki", defaultValue: true },
    showProgress: { type: ControlType.Boolean, title: "Pasek postępu", defaultValue: true },
    showForm: { type: ControlType.Boolean, title: "Formularz wpłaty", defaultValue: false },
    showButton: { type: ControlType.Boolean, title: "Przycisk wpłaty", defaultValue: false },
    showDonors: { type: ControlType.Boolean, title: "Lista darczyńców", defaultValue: false },

    showImage: { type: ControlType.Boolean, title: "Pokaż zdjęcie", defaultValue: true, hidden: (props) => !props.showCard },
    showDescription: { type: ControlType.Boolean, title: "Pokaż opis", defaultValue: true, hidden: (props) => !props.showCard },
    showBeneficiary: { type: ControlType.Boolean, title: "Pokaż beneficjenta", defaultValue: true, hidden: (props) => !props.showCard },
    showSupportButton: { type: ControlType.Boolean, title: "Przycisk Wesprzyj", defaultValue: true, hidden: (props) => !props.showCard || !props.showForm },
    showGallery: { type: ControlType.Boolean, title: "Pokaż galerię", defaultValue: true, hidden: (props) => !props.showCard },

    amounts: { type: ControlType.Array, title: "Kwoty", control: { type: ControlType.Number }, defaultValue: [20, 50, 100, 200], hidden: (props) => !props.showForm },
    showCustomAmount: { type: ControlType.Boolean, title: "Własna kwota", defaultValue: true, hidden: (props) => !props.showForm },
    showMessage: { type: ControlType.Boolean, title: "Pole wiadomości", defaultValue: true, hidden: (props) => !props.showForm },
    showAnonymousOption: { type: ControlType.Boolean, title: "Opcja anonimowości", defaultValue: true, hidden: (props) => !props.showForm },
    minAmount: { type: ControlType.Number, title: "Min. kwota", defaultValue: 5, min: 1, hidden: (props) => !props.showForm },

    privacyPolicyUrl: { type: ControlType.String, title: "URL polityki prywatności", defaultValue: "", hidden: (props) => !props.showForm },
    privacyPolicyText: { type: ControlType.String, title: "Tekst zgody", defaultValue: "Wpłacając, wyrażasz zgodę na przetwarzanie Twoich danych osobowych zgodnie z polityką prywatności i upoważniasz Fundację do przekazania informacji podanych w formularzu osobom, które podejmują decyzje w niniejszej kwestii, a także do przesyłania informacji za pośrednictwem newslettera.", hidden: (props) => !props.showForm || !props.privacyPolicyUrl },

    buttonAmount: { type: ControlType.Number, title: "Kwota przycisku", defaultValue: 50, min: 1, hidden: (props) => !props.showButton },
    buttonText: { type: ControlType.String, title: "Tekst przycisku", defaultValue: "Wpłać {amount} zł", hidden: (props) => !props.showButton },

    donorsLimit: { type: ControlType.Number, title: "Limit darczyńców", defaultValue: 5, min: 1, max: 20, hidden: (props) => !props.showDonors },
    showDonorAmount: { type: ControlType.Boolean, title: "Pokaż kwotę", defaultValue: true, hidden: (props) => !props.showDonors },
    showDonorMessage: { type: ControlType.Boolean, title: "Pokaż wiadomość", defaultValue: true, hidden: (props) => !props.showDonors },
    showDonorDate: { type: ControlType.Boolean, title: "Pokaż datę", defaultValue: true, hidden: (props) => !props.showDonors },

    primaryColor: { type: ControlType.Color, title: "Kolor główny", defaultValue: "#e74c3c" },
    borderRadius: { type: ControlType.Number, title: "Zaokrąglenie", defaultValue: 16, min: 0, max: 32 },
})
`
}
