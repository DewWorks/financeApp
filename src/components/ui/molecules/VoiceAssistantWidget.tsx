"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Mic, 
    MicOff, 
    Send, 
    Volume2, 
    Sparkles, 
    Loader2, 
    UploadCloud, 
    FileText, 
    CheckCircle2, 
    AlertTriangle, 
    FileSpreadsheet, 
    X 
} from "lucide-react"
import { Button } from "@/components/ui/atoms/button"

interface VoiceAssistantWidgetProps {
    onRefresh: () => Promise<void>;
}

export function VoiceAssistantWidget({ onRefresh }: VoiceAssistantWidgetProps) {
    // Mode switcher: 'voice' (Fin Assistant) or 'import' (Statement Uploader)
    const [activeTab, setActiveTab] = useState<"voice" | "import">("voice")

    // Voice / Chat State
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [reply, setReply] = useState<string | null>(null)
    const [supportVoice, setSupportVoice] = useState(true)
    const [typedMessage, setTypedMessage] = useState("")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const recognitionRef = useRef<any>(null)

    // File Import State
    const [file, setFile] = useState<File | null>(null)
    const [isDragActive, setIsDragActive] = useState(false)
    const [importStatus, setImportStatus] = useState<"idle" | "selected" | "loading" | "success" | "error">("idle")
    const [importMessage, setImportMessage] = useState("")
    const [importedCount, setImportedCount] = useState(0)
    const [importedList, setImportedList] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Speech Recognition setup
    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (!SpeechRecognition) {
            setSupportVoice(false)
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = "pt-BR"

        recognition.onstart = () => {
            setIsListening(true)
            setTranscript("")
            setReply(null)
            setErrorMsg(null)
        }

        recognition.onresult = (event: any) => {
            const currentResult = event.resultIndex
            const speechText = event.results[currentResult][0].transcript
            setTranscript(speechText)
            processVoiceMessage(speechText)
        }

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event)
            setIsListening(false)
            if (event.error === "not-allowed") {
                setErrorMsg("Permissão de microfone negada. Verifique as configurações do seu navegador.")
            } else {
                setErrorMsg("Não consegui ouvir. Tente falar novamente.")
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
    }, [])

    // Voice/Chat Logic
    const toggleListening = () => {
        if (!supportVoice) return

        if (isListening) {
            recognitionRef.current?.stop()
        } else {
            try {
                recognitionRef.current?.start()
            } catch (e) {
                console.error("Failed to start speech recognition", e)
                recognitionRef.current?.stop()
            }
        }
    }

    const processVoiceMessage = async (messageText: string) => {
        if (!messageText.trim()) return

        setIsProcessing(true)
        setReply(null)
        setErrorMsg(null)

        const isDemoMode = typeof window !== "undefined" && !localStorage.getItem("auth_token");
        if (isDemoMode) {
            setTimeout(async () => {
                let replyText = "Desculpe, não entendi o formato dessa transação. Você pode tentar algo como: 'Gastei R$ 40 com mercado' ou 'Recebi R$ 3000 de salário'.";
                const lowerText = messageText.toLowerCase();
                if (
                    lowerText.includes("gastei") || 
                    lowerText.includes("recebi") || 
                    lowerText.includes("paguei") || 
                    lowerText.includes("comi") || 
                    lowerText.includes("comprar") || 
                    lowerText.includes("padaria") || 
                    lowerText.includes("almoço") || 
                    lowerText.includes("netflix") || 
                    lowerText.includes("pix") ||
                    lowerText.includes("salário") ||
                    lowerText.includes("aluguel")
                ) {
                    replyText = `Entendido! Processei o seu comando de voz/texto e registrei a transação com sucesso no seu painel temporário. 🚀\n\nDescrição: "${messageText}"\n\n*(Lembre-se: em Modo de Demonstração as transações não são salvas permanentemente. Crie uma conta ou faça login para começar de verdade!)*`;
                }
                setReply(replyText)
                setIsProcessing(false)
            }, 1200);
            return;
        }

        try {
            const response = await fetch("/api/agent/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: messageText }),
            })

            if (!response.ok) {
                throw new Error("Failed to process message")
            }

            const data = await response.json()
            setReply(data.response)
            
            if (onRefresh) {
                await onRefresh()
            }
        } catch (error) {
            console.error("Error processing agent message:", error)
            setErrorMsg("Opa! Tive uma falha ao enviar o comando. Tente novamente.")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSendText = () => {
        if (!typedMessage.trim()) return
        const msg = typedMessage
        setTranscript(msg)
        setTypedMessage("")
        processVoiceMessage(msg)
    }

    const speakReply = () => {
        if (!reply || !("speechSynthesis" in window)) return
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(reply)
        utterance.lang = "pt-BR"
        window.speechSynthesis.speak(utterance)
    }

    // Drag and Drop File Handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true)
        } else if (e.type === "dragleave") {
            setIsDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0]
            const extension = droppedFile.name.split(".").pop()?.toLowerCase()
            if (extension === "pdf" || extension === "csv") {
                setFile(droppedFile)
                setImportStatus("selected")
                setImportMessage("")
            } else {
                setImportStatus("error")
                setImportMessage("Formato não suportado. Envie apenas arquivos PDF ou CSV.")
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setImportStatus("selected")
            setImportMessage("")
        }
    }

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleImport = async () => {
        if (!file) return

        setImportStatus("loading")
        const formData = new FormData()
        formData.append("file", file)

        const isDemoMode = typeof window !== "undefined" && !localStorage.getItem("auth_token");
        if (isDemoMode) {
            setTimeout(() => {
                setImportedCount(5)
                setImportedList([
                    "Despesa de Teste: Uber R$ 22,90 (Transporte)",
                    "Despesa de Teste: Padaria R$ 15,50 (Alimentação)",
                    "Despesa de Teste: Netflix R$ 55,90 (Assinaturas)",
                    "Receita de Teste: Pix Recebido R$ 120,00 (Outros)",
                    "Despesa de Teste: Posto Shell R$ 150,00 (Transporte)"
                ])
                setImportStatus("success")
            }, 2000);
            return;
        }

        try {
            const response = await fetch("/api/transactions/import-file", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || "Erro ao importar arquivo.")
            }

            const data = await response.json()
            setImportedCount(data.importedCount || 0)
            setImportedList(data.transactions || [])
            setImportStatus("success")

            if (onRefresh) {
                await onRefresh()
            }
        } catch (error: any) {
            console.error("Import error:", error)
            setImportStatus("error")
            setImportMessage(error.message || "Ocorreu um erro no processamento do arquivo. Verifique se é um extrato válido.")
        }
    }

    const resetImportWidget = () => {
        setFile(null)
        setImportStatus("idle")
        setImportMessage("")
        setImportedCount(0)
        setImportedList([])
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ["Bytes", "KB", "MB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
    }

    return (
        <div id="voice-assistant-widget" className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6 flex flex-col justify-between min-h-[300px] transition-all duration-300">
            {/* Background decorative glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
                activeTab === "voice" 
                    ? "bg-gradient-to-br from-indigo-500/10 to-purple-500/10" 
                    : "bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
            }`} />

            {/* Header: AI branding & Tab Switcher */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-gray-700/50 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg transition-colors duration-300 ${
                            activeTab === "voice" 
                                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500" 
                                : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500"
                        }`}>
                            <Sparkles className={`w-4 h-4 ${activeTab === "voice" ? "animate-pulse" : ""}`} />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                Fin — Co-Piloto de IA
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                {activeTab === "voice" 
                                    ? "Fale naturalmente para registrar transações financeiras" 
                                    : "Envie faturas de cartão ou extratos (PDF/CSV) sem custo"}
                            </p>
                        </div>
                    </div>

                    {/* Tabs switcher */}
                    <div className="bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl flex gap-1 self-start sm:self-center">
                        <button
                            onClick={() => setActiveTab("voice")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                activeTab === "voice"
                                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                            }`}
                        >
                            <Mic className="w-3.5 h-3.5" />
                            Falar com Fin
                        </button>
                        <button
                            onClick={() => setActiveTab("import")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                                activeTab === "import"
                                    ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
                            }`}
                        >
                            <UploadCloud className="w-3.5 h-3.5" />
                            Importar Extrato
                        </button>
                    </div>
                </div>

                {/* Tab Contents */}
                <div className="min-h-[140px] flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {activeTab === "voice" ? (
                            <motion.div
                                key="voice-tab"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col justify-between h-full"
                            >
                                {/* Voice Display */}
                                <div className="min-h-[64px] flex flex-col justify-center mb-4">
                                    <AnimatePresence mode="wait">
                                        {isListening && (
                                            <motion.div
                                                key="voice-listening"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center py-2"
                                            >
                                                <div className="flex gap-1.5 items-center justify-center mb-2">
                                                    <motion.div className="w-1.5 h-3 rounded-full bg-indigo-500" animate={{ height: [12, 24, 12] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                                                    <motion.div className="w-1.5 h-3 rounded-full bg-indigo-400" animate={{ height: [8, 30, 8] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} />
                                                    <motion.div className="w-1.5 h-3 rounded-full bg-indigo-500" animate={{ height: [12, 24, 12] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} />
                                                </div>
                                                <span className="text-xs text-indigo-500 font-medium">Ouvindo... Fale agora</span>
                                            </motion.div>
                                        )}

                                        {!isListening && isProcessing && (
                                            <motion.div
                                                key="voice-processing"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center py-2 gap-1.5"
                                            >
                                                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">Fin analisando seu comando...</span>
                                            </motion.div>
                                        )}

                                        {!isListening && !isProcessing && transcript && (
                                            <motion.div
                                                key="voice-transcript"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300 leading-tight mb-2"
                                            >
                                                <span className="font-semibold text-indigo-500 block text-[9px] uppercase tracking-wide mb-0.5">Você disse:</span>
                                                "{transcript}"
                                            </motion.div>
                                        )}

                                        {!isListening && !isProcessing && reply && (
                                            <motion.div
                                                key="voice-reply"
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-indigo-50/50 dark:bg-indigo-950/10 p-3 rounded-xl border border-indigo-100/30 dark:border-indigo-900/20 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed flex items-start gap-2.5"
                                            >
                                                <div className="flex-1">
                                                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 block text-[9px] uppercase tracking-wide mb-0.5">Fin:</span>
                                                    {reply}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 self-end flex-shrink-0"
                                                    onClick={speakReply}
                                                    title="Ouvir resposta"
                                                >
                                                    <Volume2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </motion.div>
                                        )}

                                        {errorMsg && (
                                            <motion.div
                                                key="voice-error"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-xs text-red-500 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 p-2.5 rounded-xl border border-red-100/20 dark:border-red-900/20 text-center font-medium"
                                            >
                                                {errorMsg}
                                            </motion.div>
                                        )}

                                        {!isListening && !isProcessing && !transcript && !reply && !errorMsg && (
                                            <motion.div
                                                key="voice-empty"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-center text-xs text-gray-400 dark:text-gray-500 py-3 italic"
                                            >
                                                Diga algo como: "Gastei 45 reais com almoço no iFood hoje"
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Voice Input Row */}
                                <div className="flex gap-2 items-center mt-2">
                                    {supportVoice ? (
                                        <Button
                                            type="button"
                                            onClick={toggleListening}
                                            className={`flex-grow sm:flex-grow-0 sm:px-6 rounded-xl h-11 font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                                                isListening
                                                    ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20"
                                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                                            }`}
                                        >
                                            {isListening ? (
                                                <>
                                                    <MicOff className="w-4 h-4 animate-pulse" />
                                                    Parar
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="w-4 h-4" />
                                                    Gravar Áudio
                                                </>
                                            )}
                                        </Button>
                                    ) : null}

                                    <div className="flex-1 flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Ou digite o comando..."
                                            value={typedMessage}
                                            onChange={(e) => setTypedMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSendText()
                                            }}
                                            disabled={isProcessing || isListening}
                                            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl h-11 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-800 dark:text-gray-100 disabled:opacity-50"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={handleSendText}
                                            disabled={!typedMessage.trim() || isProcessing || isListening}
                                            className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 flex-shrink-0"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="import-tab"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col justify-between h-full"
                            >
                                {/* Drag & Drop Import Layout */}
                                <div className="min-h-[100px] flex flex-col justify-center mb-4">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".pdf,.csv"
                                        className="hidden"
                                    />

                                    {importStatus === "idle" && (
                                        <div
                                            onDragEnter={handleDrag}
                                            onDragOver={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDrop={handleDrop}
                                            onClick={handleButtonClick}
                                            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                                                isDragActive
                                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 hover:bg-gray-50 dark:hover:bg-gray-900/30"
                                            }`}
                                        >
                                            <UploadCloud className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                                Arraste seu PDF/CSV ou clique para selecionar
                                            </p>
                                            <span className="text-[9px] text-gray-400">Suporta faturas de bancos em geral. Processado localmente.</span>
                                        </div>
                                    )}

                                    {importStatus === "selected" && file && (
                                        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 p-3 rounded-xl flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {file.name.endsWith(".csv") ? (
                                                    <FileSpreadsheet className="w-8 h-8 text-teal-500 flex-shrink-0" />
                                                ) : (
                                                    <FileText className="w-8 h-8 text-red-400 flex-shrink-0" />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">{formatBytes(file.size)}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={resetImportWidget}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 h-8 w-8"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )}

                                    {importStatus === "loading" && (
                                        <div className="flex flex-col items-center justify-center p-3 gap-2">
                                            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium animate-pulse">
                                                Fin analisando e extraindo dados com IA...
                                            </p>
                                            <span className="text-[10px] text-gray-400">Higienizando descrições e identificando categorias</span>
                                        </div>
                                    )}

                                    {importStatus === "success" && (
                                        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-900/20 p-3 rounded-xl flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                                <span className="text-xs font-bold">Importação Concluída!</span>
                                            </div>
                                            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-tight">
                                                Adicionamos **{importedCount}** transações no seu perfil.
                                            </p>
                                            {importedList.length > 0 && (
                                                <details className="text-[10px] text-gray-400 dark:text-gray-500 cursor-pointer">
                                                    <summary className="hover:text-gray-600 dark:hover:text-gray-300 select-none outline-none">
                                                        Ver transações importadas
                                                    </summary>
                                                    <div className="max-h-[80px] overflow-y-auto mt-1 pl-2 border-l border-emerald-200 dark:border-emerald-900/40 space-y-0.5">
                                                        {importedList.slice(0, 20).map((t, idx) => (
                                                            <div key={idx} className="truncate">
                                                                {t}
                                                            </div>
                                                        ))}
                                                        {importedList.length > 20 && <div>...e mais {importedList.length - 20} itens.</div>}
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    )}

                                    {importStatus === "error" && (
                                        <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100/20 dark:border-red-900/20 p-3 rounded-xl flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                                <span className="text-xs font-bold">Falha na Importação</span>
                                            </div>
                                            <p className="text-[11px] text-red-600 dark:text-red-300 leading-tight">
                                                {importMessage}
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={resetImportWidget}
                                                className="self-start text-[10px] h-7 px-2 border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                                            >
                                                Tentar novamente
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Import Submit Trigger */}
                                {importStatus === "selected" && (
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            onClick={handleImport}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                                        >
                                            Confirmar e Importar Extrato
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
