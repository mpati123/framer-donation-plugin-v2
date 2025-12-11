import { framer } from "framer-plugin"
import { useState, useEffect } from "react"
import "./App.css"

import { getDonationWidgetCode } from "./components/DonationWidget"

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

interface WidgetOptions {
    showCard: boolean
    showProgress: boolean
    showForm: boolean
    showButton: boolean
    showDonors: boolean
}

const WIDGET_FILE_NAME = "DonationWidget.tsx"

const SECTION_INFO = {
    showCard: { name: "Karta zbiórki", description: "Zdjęcie, tytuł, opis" },
    showProgress: { name: "Pasek postępu", description: "Zebrana kwota i cel" },
    showForm: { name: "Formularz wpłaty", description: "Pełny formularz" },
    showButton: { name: "Przycisk wpłaty", description: "Szybka wpłata" },
    showDonors: { name: "Lista darczyńców", description: "Ostatnie wpłaty" },
}

framer.showUI({
    position: "top right",
    width: 340,
    height: 600,
})

export function App() {
    const [apiUrl, setApiUrl] = useState("")
    const [apiKey, setApiKey] = useState("")
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [selectedCampaign, setSelectedCampaign] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isConfigured, setIsConfigured] = useState(false)
    const [adding, setAdding] = useState(false)
    const [widgetOptions, setWidgetOptions] = useState<WidgetOptions>({
        showCard: true,
        showProgress: true,
        showForm: false,
        showButton: false,
        showDonors: false,
    })

    useEffect(() => {
        const loadConfig = async () => {
            const savedApiUrl = await framer.getPluginData("apiUrl")
            const savedApiKey = await framer.getPluginData("apiKey")
            if (savedApiUrl) setApiUrl(savedApiUrl)
            if (savedApiKey) setApiKey(savedApiKey)
            if (savedApiUrl && savedApiKey) {
                setIsConfigured(true)
                fetchCampaigns(savedApiUrl, savedApiKey)
            }
        }
        loadConfig()
    }, [])

    const fetchCampaigns = async (url: string, key: string) => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${url}/campaigns?status=all`, {
                headers: { "X-API-Key": key },
            })
            if (!response.ok) throw new Error("Nie udało się pobrać zbiórek")
            const data = await response.json()
            setCampaigns(data.campaigns || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : "Błąd połączenia")
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async () => {
        if (!apiUrl || !apiKey) {
            setError("Wypełnij wszystkie pola")
            return
        }
        await framer.setPluginData("apiUrl", apiUrl)
        await framer.setPluginData("apiKey", apiKey)
        setIsConfigured(true)
        fetchCampaigns(apiUrl, apiKey)
    }

    const handleDisconnect = async () => {
        await framer.setPluginData("apiUrl", "")
        await framer.setPluginData("apiKey", "")
        setApiUrl("")
        setApiKey("")
        setCampaigns([])
        setSelectedCampaign("")
        setIsConfigured(false)
    }

    const ensureWidgetExists = async (): Promise<string | null> => {
        const existingFiles = await framer.getCodeFiles()
        const existingFile = existingFiles.find(f => f.name === WIDGET_FILE_NAME)

        if (existingFile) {
            const componentExport = existingFile.exports.find(e => e.type === "component")
            if (componentExport && 'insertURL' in componentExport) {
                return (componentExport as { insertURL: string }).insertURL
            }
            return null
        }

        // Check permission
        const canCreate = await framer.isAllowedTo("createCodeFile")
        if (!canCreate) {
            setError("Brak uprawnień do tworzenia plików kodu")
            return null
        }

        // Create widget file
        await framer.createCodeFile(WIDGET_FILE_NAME, getDonationWidgetCode())

        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 500))

        // Re-fetch
        const updatedFiles = await framer.getCodeFiles()
        const updatedFile = updatedFiles.find(f => f.name === WIDGET_FILE_NAME)

        if (updatedFile) {
            const componentExport = updatedFile.exports.find(e => e.type === "component")
            if (componentExport && 'insertURL' in componentExport) {
                return (componentExport as { insertURL: string }).insertURL
            }
        }

        return null
    }

    const handleAddWidget = async () => {
        if (!selectedCampaign) {
            setError("Wybierz zbiórkę")
            return
        }

        setAdding(true)
        setError(null)

        try {
            const widgetUrl = await ensureWidgetExists()

            if (!widgetUrl) {
                setError("Nie udało się utworzyć komponentu")
                return
            }

            await framer.addComponentInstance({
                url: widgetUrl,
                attributes: {
                    controls: {
                        campaignId: selectedCampaign,
                        apiUrl: apiUrl,
                        ...widgetOptions,
                    }
                }
            })

            framer.notify("Dodano widget zbiórki")
        } catch (err) {
            console.error('Error:', err)
            setError(`Błąd: ${err instanceof Error ? err.message : String(err)}`)
        } finally {
            setAdding(false)
        }
    }

    // Config screen
    if (!isConfigured) {
        return (
            <div id="donation-plugin-root">
                <div className="header">
                    <h1>Donation Plugin</h1>
                    <p className="subtitle">Połącz z API aby zarządzać zbiórkami</p>
                </div>

                {error && <div className="error">{error}</div>}

                <div className="form-group">
                    <label>API URL</label>
                    <input
                        type="text"
                        placeholder="https://your-app.vercel.app/api"
                        value={apiUrl}
                        onChange={(e) => setApiUrl(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>API Key</label>
                    <input
                        type="password"
                        placeholder="Twój klucz API"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </div>

                <button className="btn-primary" onClick={handleConnect}>
                    Połącz
                </button>

                <div className="help-text">
                    <p>Nie masz jeszcze API?</p>
                    <a href="https://github.com/lupusursus/donation-framer" target="_blank">
                        Zobacz instrukcję instalacji
                    </a>
                </div>
            </div>
        )
    }

    const selectedCampaignData = campaigns.find((c) => c.id === selectedCampaign)

    const toggleOption = (key: keyof WidgetOptions) => {
        setWidgetOptions(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const selectedCount = Object.values(widgetOptions).filter(Boolean).length

    // Main screen
    return (
        <div id="donation-plugin-root">
            <div className="header-row">
                <h1>Donation Plugin</h1>
                <button className="btn-secondary" onClick={handleDisconnect}>
                    Rozłącz
                </button>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="form-group">
                <label>Wybierz zbiórkę</label>
                {loading ? (
                    <div className="loading">Ładowanie...</div>
                ) : (
                    <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                    >
                        <option value="">-- Wybierz zbiórkę --</option>
                        {campaigns.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.title} ({c.collected_amount.toLocaleString('pl-PL')}/{c.goal_amount.toLocaleString('pl-PL')} zł)
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {selectedCampaignData && (
                <div className="campaign-preview">
                    {selectedCampaignData.image_url && (
                        <div
                            className="preview-image"
                            style={{ backgroundImage: `url(${selectedCampaignData.image_url})` }}
                        />
                    )}
                    <div className="preview-info">
                        <div className="preview-title">{selectedCampaignData.title}</div>
                        {selectedCampaignData.beneficiary && (
                            <div className="preview-beneficiary">Dla: {selectedCampaignData.beneficiary}</div>
                        )}
                        <div className="preview-stats">
                            {selectedCampaignData.collected_amount.toLocaleString('pl-PL')} / {selectedCampaignData.goal_amount.toLocaleString('pl-PL')} zł
                        </div>
                    </div>
                </div>
            )}

            <div className="form-group">
                <label>Wybierz sekcje widgetu</label>
                <div className="component-grid">
                    {(Object.keys(SECTION_INFO) as (keyof typeof SECTION_INFO)[]).map((key) => (
                        <button
                            key={key}
                            type="button"
                            className={`component-card ${widgetOptions[key] ? "active" : ""}`}
                            onClick={() => toggleOption(key)}
                        >
                            <span className="component-name">{SECTION_INFO[key].name}</span>
                            <span className="component-desc">{SECTION_INFO[key].description}</span>
                        </button>
                    ))}
                </div>
            </div>

            <button
                className="btn-primary"
                onClick={handleAddWidget}
                disabled={!selectedCampaign || adding || selectedCount === 0}
            >
                {adding ? "Dodawanie..." : `Dodaj widget (${selectedCount}) na canvas`}
            </button>
        </div>
    )
}
