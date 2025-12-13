import { framer } from "framer-plugin"
import { useState, useEffect } from "react"
import "./App.css"

import { getDonationWidgetCode } from "./components/DonationWidget"
import { getDonationGridCode } from "./components/DonationGrid"

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

interface GridOptions {
    showImage: boolean
    showProgress: boolean
    showBeneficiary: boolean
    showDescription: boolean
    showDonateButton: boolean
}

const WIDGET_FILE_NAME = "DonationWidget.tsx"
const GRID_FILE_NAME = "DonationGrid.tsx"

const SECTION_INFO = {
    showCard: { name: "Karta zbiórki", description: "Zdjęcie, tytuł, opis" },
    showProgress: { name: "Pasek postępu", description: "Zebrana kwota i cel" },
    showForm: { name: "Formularz wpłaty", description: "Pełny formularz" },
    showButton: { name: "Przycisk wpłaty", description: "Szybka wpłata" },
    showDonors: { name: "Lista darczyńców", description: "Ostatnie wpłaty" },
}

const GRID_SECTION_INFO = {
    showImage: { name: "Zdjęcie", description: "Obrazek zbiórki" },
    showProgress: { name: "Pasek postępu", description: "Zebrana kwota i cel" },
    showBeneficiary: { name: "Beneficjent", description: "Dla kogo zbiórka" },
    showDescription: { name: "Opis", description: "Krótki opis" },
    showDonateButton: { name: "Przycisk Wesprzyj", description: "Link do zbiórki" },
}

framer.showUI({
    position: "top right",
    width: 340,
    height: 650,
})

export function App() {
    const [apiUrl, setApiUrl] = useState("")
    const [apiKey, setApiKey] = useState("")
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isConfigured, setIsConfigured] = useState(false)
    const [adding, setAdding] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [mode, setMode] = useState<string>("canvas")
    const [widgetOptions, setWidgetOptions] = useState<WidgetOptions>({
        showCard: true,
        showProgress: true,
        showForm: false,
        showButton: false,
        showDonors: false,
    })
    const [gridOptions, setGridOptions] = useState<GridOptions>({
        showImage: true,
        showProgress: true,
        showBeneficiary: true,
        showDescription: true,
        showDonateButton: true,
    })

    useEffect(() => {
        const loadConfig = async () => {
            // Check current mode
            const currentMode = await framer.getMode()
            setMode(currentMode)

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
        const canSetData = await framer.isAllowedTo("setPluginData")
        if (canSetData) {
            await framer.setPluginData("apiUrl", apiUrl)
            await framer.setPluginData("apiKey", apiKey)
        }
        setIsConfigured(true)
        fetchCampaigns(apiUrl, apiKey)
    }

    const handleDisconnect = async () => {
        const canSetData = await framer.isAllowedTo("setPluginData")
        if (canSetData) {
            await framer.setPluginData("apiUrl", "")
            await framer.setPluginData("apiKey", "")
        }
        setApiUrl("")
        setApiKey("")
        setCampaigns([])
        setSelectedCampaigns([])
        setIsConfigured(false)
    }

    const toggleCampaign = (id: string) => {
        setSelectedCampaigns(prev =>
            prev.includes(id)
                ? prev.filter(c => c !== id)
                : [...prev, id]
        )
    }

    const ensureWidgetExists = async (forceUpdate = false): Promise<string | null> => {
        const existingFiles = await framer.getCodeFiles()
        const existingFile = existingFiles.find(f => f.name === WIDGET_FILE_NAME)

        if (existingFile) {
            if (forceUpdate) {
                // Update existing file using setFileContent
                await existingFile.setFileContent(getDonationWidgetCode())
                await new Promise(resolve => setTimeout(resolve, 300))
            }
            const componentExport = existingFile.exports.find(e => e.type === "component")
            if (componentExport && 'insertURL' in componentExport) {
                return (componentExport as { insertURL: string }).insertURL
            }
            return null
        }

        // Create new file
        const canCreate = await framer.isAllowedTo("createCodeFile")
        if (!canCreate) {
            setError("Brak uprawnień do tworzenia plików kodu")
            return null
        }

        await framer.createCodeFile(WIDGET_FILE_NAME, getDonationWidgetCode())
        await new Promise(resolve => setTimeout(resolve, 500))

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

    const ensureGridExists = async (forceUpdate = false): Promise<string | null> => {
        const existingFiles = await framer.getCodeFiles()
        const existingFile = existingFiles.find(f => f.name === GRID_FILE_NAME)

        if (existingFile) {
            if (forceUpdate) {
                // Update existing file using setFileContent
                await existingFile.setFileContent(getDonationGridCode())
                await new Promise(resolve => setTimeout(resolve, 300))
            }
            const componentExport = existingFile.exports.find(e => e.type === "component")
            if (componentExport && 'insertURL' in componentExport) {
                return (componentExport as { insertURL: string }).insertURL
            }
            return null
        }

        // Create new file
        const canCreate = await framer.isAllowedTo("createCodeFile")
        if (!canCreate) {
            setError("Brak uprawnień do tworzenia plików kodu")
            return null
        }

        await framer.createCodeFile(GRID_FILE_NAME, getDonationGridCode())
        await new Promise(resolve => setTimeout(resolve, 500))

        const updatedFiles = await framer.getCodeFiles()
        const updatedFile = updatedFiles.find(f => f.name === GRID_FILE_NAME)

        if (updatedFile) {
            const componentExport = updatedFile.exports.find(e => e.type === "component")
            if (componentExport && 'insertURL' in componentExport) {
                return (componentExport as { insertURL: string }).insertURL
            }
        }

        return null
    }

    const handleUpdateCode = async () => {
        setUpdating(true)
        setError(null)

        try {
            await ensureWidgetExists(true)
            await ensureGridExists(true)
            framer.notify("Kod zaktualizowany!")
        } catch (err) {
            setError(`Błąd aktualizacji: ${err instanceof Error ? err.message : String(err)}`)
        } finally {
            setUpdating(false)
        }
    }

    const handleAddWidget = async () => {
        if (selectedCampaigns.length !== 1) return

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
                        campaignId: selectedCampaigns[0],
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

    const handleAddGrid = async () => {
        if (selectedCampaigns.length < 2) return

        setAdding(true)
        setError(null)

        try {
            const gridUrl = await ensureGridExists()

            if (!gridUrl) {
                setError("Nie udało się utworzyć komponentu")
                return
            }

            await framer.addComponentInstance({
                url: gridUrl,
                attributes: {
                    controls: {
                        apiUrl: apiUrl,
                        campaignIds: selectedCampaigns.join(", "),
                        ...gridOptions,
                    }
                }
            })

            framer.notify("Dodano siatkę zbiórek")
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

    const toggleOption = (key: keyof WidgetOptions) => {
        setWidgetOptions(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const toggleGridOption = (key: keyof GridOptions) => {
        setGridOptions(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const selectedCount = Object.values(widgetOptions).filter(Boolean).length
    const isSingleSelected = selectedCampaigns.length === 1
    const isMultipleSelected = selectedCampaigns.length > 1

    // Main screen
    return (
        <div id="donation-plugin-root">
            <div className="header-row">
                <h1>Donation Plugin</h1>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        className="btn-secondary"
                        onClick={handleUpdateCode}
                        disabled={updating}
                        title="Aktualizuj kod komponentów"
                    >
                        {updating ? "..." : "↻"}
                    </button>
                    <button className="btn-secondary" onClick={handleDisconnect}>
                        Rozłącz
                    </button>
                </div>
            </div>

            {error && <div className="error">{error}</div>}

            <div className="form-group">
                <label>Wybierz zbiórki ({selectedCampaigns.length} zaznaczonych)</label>
                {loading ? (
                    <div className="loading">Ładowanie...</div>
                ) : (
                    <div className="campaign-list">
                        {campaigns.map((c) => (
                            <label
                                key={c.id}
                                className={`campaign-checkbox ${selectedCampaigns.includes(c.id) ? 'selected' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedCampaigns.includes(c.id)}
                                    onChange={() => toggleCampaign(c.id)}
                                />
                                <div className="campaign-checkbox-content">
                                    {c.image_url && (
                                        <div
                                            className="campaign-thumb"
                                            style={{ backgroundImage: `url(${c.image_url})` }}
                                        />
                                    )}
                                    <div className="campaign-info">
                                        <div className="campaign-title">{c.title}</div>
                                        <div className="campaign-stats">
                                            {c.collected_amount.toLocaleString('pl-PL')} / {c.goal_amount.toLocaleString('pl-PL')} zł
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {isSingleSelected && (
                <>
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

                    {mode === "code" ? (
                        <div className="hint">
                            Przejdź do trybu Canvas aby dodać widget
                        </div>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={handleAddWidget}
                            disabled={adding || selectedCount === 0}
                        >
                            {adding ? "Dodawanie..." : `Dodaj widget na canvas`}
                        </button>
                    )}
                </>
            )}

            {isMultipleSelected && (
                <>
                    <div className="form-group">
                        <label>Wybierz sekcje siatki</label>
                        <div className="component-grid">
                            {(Object.keys(GRID_SECTION_INFO) as (keyof typeof GRID_SECTION_INFO)[]).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    className={`component-card ${gridOptions[key] ? "active" : ""}`}
                                    onClick={() => toggleGridOption(key)}
                                >
                                    <span className="component-name">{GRID_SECTION_INFO[key].name}</span>
                                    <span className="component-desc">{GRID_SECTION_INFO[key].description}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {mode === "code" ? (
                        <div className="hint">
                            Przejdź do trybu Canvas aby dodać siatkę
                        </div>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={handleAddGrid}
                            disabled={adding}
                        >
                            {adding ? "Dodawanie..." : `Dodaj siatkę ${selectedCampaigns.length} zbiórek`}
                        </button>
                    )}
                </>
            )}

            {selectedCampaigns.length === 0 && (
                <div className="hint">
                    Zaznacz jedną zbiórkę aby dodać widget, lub wiele aby dodać siatkę
                </div>
            )}
        </div>
    )
}
