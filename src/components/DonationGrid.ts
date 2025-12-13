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
    images: string[]
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

// Plugin version - must match api/version/index.ts
const COMPONENT_VERSION = "1.0.1"

interface VersionInfo {
    version: string
    changelog: string
}

interface LicenseStatus {
    valid: boolean
    status: "active" | "trial" | "expired" | "locked" | "not_found"
    daysRemaining?: number
    message?: string
}

interface Props {
    licenseKey?: string
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

function LicenseExpiredBanner({ daysRemaining, onRenew }: { daysRemaining?: number; onRenew: () => void }) {
    const isExpired = !daysRemaining || daysRemaining <= 0

    return (
        <div style={{
            background: isExpired ? "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            boxShadow: isExpired ? "0 2px 8px rgba(220, 38, 38, 0.3)" : "0 2px 8px rgba(245, 158, 11, 0.3)",
        }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {isExpired ? "🔒 Licencja wygasła" : \`⚠️ Licencja wygasa za \${daysRemaining} dni\`}
            </div>
            <div style={{ opacity: 0.9, lineHeight: 1.4, marginBottom: 8 }}>
                {isExpired
                    ? "Płatności są zablokowane. Odnów licencję, aby przywrócić możliwość przyjmowania wpłat."
                    : "Odnów licencję, aby uniknąć przerwy w przyjmowaniu wpłat."
                }
            </div>
            <button
                onClick={onRenew}
                style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    color: "#fff",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                }}
            >
                Odnów teraz →
            </button>
        </div>
    )
}

function UpdateBanner({ changelog, onDismiss }: { changelog: string; onDismiss: () => void }) {
    return (
        <div style={{
            background: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
            color: "#fff",
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 13,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            boxShadow: "0 2px 8px rgba(255, 152, 0, 0.3)",
        }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Dostępna aktualizacja komponentu</div>
                <div style={{ opacity: 0.9, lineHeight: 1.4 }}>{changelog}</div>
                <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>
                    Skopiuj nowy kod z buildera i wklej do Framera
                </div>
            </div>
            <button
                onClick={onDismiss}
                style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    padding: 4,
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CloseIcon size={16} />
            </button>
        </div>
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

// License API URL
const LICENSE_API_URL = "https://framer-donation-plugin2.vercel.app/api"
const LICENSE_CACHE_KEY = "donations_plugin_license_grid"
const LICENSE_CHECK_INTERVAL = 24 * 60 * 60 * 1000

export default function DonationGrid({
    licenseKey = "",
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

    // Detail modal state (full campaign info)
    const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)

    // Donate modal state (form)
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

    // Version check state
    const [updateAvailable, setUpdateAvailable] = useState<VersionInfo | null>(null)
    const [updateDismissed, setUpdateDismissed] = useState(false)

    // License state
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null)
    const [licenseChecked, setLicenseChecked] = useState(false)

    // Check if we're in Framer editor
    const isFramerEditor = typeof window !== "undefined" && (
        window.location.hostname.includes("framer.website") === false &&
        window.location.hostname.includes("framer.app") ||
        window.location.hostname === "localhost" ||
        window.parent !== window
    )

    // License verification
    useEffect(() => {
        if (!licenseKey) {
            setLicenseStatus({ valid: false, status: "not_found", message: "Brak klucza licencyjnego" })
            setLicenseChecked(true)
            return
        }

        const cached = localStorage.getItem(LICENSE_CACHE_KEY)
        if (cached) {
            try {
                const { status, checkedAt, key } = JSON.parse(cached)
                if (key === licenseKey && Date.now() - checkedAt < LICENSE_CHECK_INTERVAL) {
                    setLicenseStatus(status)
                    setLicenseChecked(true)
                    return
                }
            } catch {}
        }

        fetch(\`\${LICENSE_API_URL}/license/verify\`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: licenseKey, domain: window.location.hostname }),
        })
            .then(r => r.json())
            .then((status: LicenseStatus) => {
                setLicenseStatus(status)
                setLicenseChecked(true)
                localStorage.setItem(LICENSE_CACHE_KEY, JSON.stringify({
                    status,
                    checkedAt: Date.now(),
                    key: licenseKey,
                }))
            })
            .catch(() => {
                setLicenseStatus({ valid: true, status: "active" })
                setLicenseChecked(true)
            })
    }, [licenseKey])

    // License locked state
    const isLicenseLocked = licenseChecked && (!licenseStatus?.valid || licenseStatus?.status === "locked" || licenseStatus?.status === "expired")
    const isLicenseExpiring = licenseChecked && licenseStatus?.valid && licenseStatus?.daysRemaining && licenseStatus.daysRemaining <= 7

    const handleRenew = () => {
        window.open("https://framer-donation-plugin2.vercel.app/dashboard/settings/billing", "_blank")
    }

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

    // Check for updates - only in Framer editor, not on published site
    useEffect(() => {
        if (!apiUrl) return

        // Detect if we're in Framer editor (canvas preview)
        const isFramerEditor = typeof window !== "undefined" && (
            window.location.hostname.includes("framer.website") === false &&
            window.location.hostname.includes("framer.app") ||
            window.location.hostname === "localhost" ||
            window.parent !== window // iframe = editor preview
        )

        if (!isFramerEditor) return

        fetch(\`\${apiUrl}/version\`)
            .then(r => r.json())
            .then(data => {
                if (data.version && data.version !== COMPONENT_VERSION) {
                    setUpdateAvailable({ version: data.version, changelog: data.changelog || "Nowa wersja dostępna" })
                }
            })
            .catch(() => {}) // Ignore errors - version check is optional
    }, [apiUrl])

    const openDetailModal = (campaign: Campaign) => {
        setDetailCampaign(campaign)
    }

    const closeDetailModal = () => {
        setDetailCampaign(null)
    }

    const openDonateModal = async (campaign: Campaign) => {
        setDetailCampaign(null) // Close detail modal if open
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

    const closeDonateModal = () => {
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
            {/* Update Banner */}
            {updateAvailable && !updateDismissed && (
                <UpdateBanner
                    changelog={updateAvailable.changelog}
                    onDismiss={() => setUpdateDismissed(true)}
                />
            )}

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
                            onClick={() => openDetailModal(campaign)}
                            style={{
                                background: "#fff",
                                borderRadius,
                                overflow: "hidden",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                display: "flex",
                                flexDirection: "column",
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
                                        onClick={(e) => { e.stopPropagation(); openDonateModal(campaign) }}
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

            {/* Detail Modal - Full campaign info */}
            {detailCampaign && (
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
                    onClick={closeDetailModal}
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
                        {detailCampaign.image_url ? (
                            <img
                                src={detailCampaign.image_url}
                                alt={detailCampaign.title}
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
                            onClick={closeDetailModal}
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
                                {detailCampaign.title}
                            </h2>

                            {detailCampaign.beneficiary && (
                                <p style={{ fontSize: 14, color: primaryColor, margin: "0 0 16px 0", fontWeight: 500 }}>
                                    Dla: {detailCampaign.beneficiary}
                                </p>
                            )}

                            {/* Progress */}
                            <div style={{ marginBottom: 20, padding: 16, background: "#f9fafb", borderRadius: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 15 }}>
                                    <span style={{ fontWeight: 700 }}>{formatCurrency(detailCampaign.collected_amount)}</span>
                                    <span style={{ color: "#666" }}>z {formatCurrency(detailCampaign.goal_amount)}</span>
                                </div>
                                <div style={{ height: 12, background: "#e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        width: \`\${Math.min(Math.round((detailCampaign.collected_amount / detailCampaign.goal_amount) * 100), 100)}%\`,
                                        background: primaryColor,
                                        borderRadius: 6,
                                    }} />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "#666" }}>
                                    <span style={{ fontWeight: 600, color: primaryColor }}>
                                        {Math.round((detailCampaign.collected_amount / detailCampaign.goal_amount) * 100)}%
                                    </span>
                                    <span>{detailCampaign.donations_count} darczyńców</span>
                                </div>
                            </div>

                            {/* Donate Button */}
                            <button
                                onClick={() => openDonateModal(detailCampaign)}
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

                            {/* Full Description with inline images */}
                            {detailCampaign.description && (
                                <div style={{ marginBottom: 24 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#333" }}>
                                        O zbiórce
                                    </h4>
                                    <div style={{
                                        fontSize: 14,
                                        color: "#555",
                                        lineHeight: 1.7,
                                    }}>
                                        {parseDescriptionWithImages(detailCampaign.description, detailCampaign.images || [])}
                                    </div>
                                </div>
                            )}

                            {/* Gallery - only unused images */}
                            {(() => {
                                const unusedImages = getUnusedImages(detailCampaign.description || "", detailCampaign.images || [])
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

            {/* Donate Modal - Form */}
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
                    onClick={closeDonateModal}
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
                                onClick={closeDonateModal}
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
    licenseKey: {
        type: ControlType.String,
        title: "🔑 Klucz licencji",
        placeholder: "DPL-XXXX-XXXX-XXXX",
        defaultValue: "",
        description: "Wprowadź klucz licencji aby aktywować widget"
    },
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
