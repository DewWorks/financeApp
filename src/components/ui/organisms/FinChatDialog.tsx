"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    X, 
    Send, 
    Mic, 
    MicOff, 
    Volume2, 
    VolumeX,
    Sparkles, 
    Loader2, 
    MessageCircle,
    ArrowLeft,
    Info,
    Copy,
    Check,
    ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/atoms/button"

interface Message {
    id: string
    text: string
    sender: "user" | "fin"
    timestamp: Date
}

interface FinChatDialogProps {
    isOpen: boolean
    onClose: () => void
    onRefresh?: () => Promise<void>
    autoStartVoice?: boolean
}

const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
        if (index % 2 === 1) {
            return <strong key={index} className="font-bold">{part}</strong>;
        }
        return part;
    });
};

export function FinChatDialog({ isOpen, onClose, onRefresh, autoStartVoice }: FinChatDialogProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isListening, setIsListening] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [typedMessage, setTypedMessage] = useState("")
    const [supportVoice, setSupportVoice] = useState(true)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [showShortcutInfo, setShowShortcutInfo] = useState(false)
    const [userId, setUserId] = useState("")
    const [copied, setCopied] = useState(false)
    const [copiedUrl, setCopiedUrl] = useState(false)
    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("fin-chat-tts-muted") === "true"
        }
        return false
    })

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem("fin-chat-tts-muted", String(isMuted))
        }
    }, [isMuted])
    
    const getVoiceUrl = () => {
        if (typeof window === "undefined") return "https://finance-pro-mu.vercel.app/?startVoice=true"
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            return "https://finance-pro-mu.vercel.app/?startVoice=true"
        }
        return window.location.origin + "/?startVoice=true"
    }

    useEffect(() => {
        if (typeof window !== "undefined") {
            const id = localStorage.getItem("user-id") || ""
            setUserId(id)
        }
    }, [isOpen])
    
    const recognitionRef = useRef<any>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Set up welcome message and speech recognition
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: "welcome",
                    text: "Olá! Sou o Fin, seu co-piloto financeiro. 💰 Como posso te ajudar hoje? Pode digitar ou clicar no microfone para falar, ex: 'Gastei R$ 40 no almoço hoje'.",
                    sender: "fin",
                    timestamp: new Date()
                }
            ])
        }

        // Web Speech API
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
            setErrorMsg(null)
        }

        recognition.onresult = (event: any) => {
            const currentResult = event.resultIndex
            const speechText = event.results[currentResult][0].transcript
            if (speechText.trim()) {
                handleSendMessage(speechText)
            }
        }

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error in chat", event)
            setIsListening(false)
            if (event.error === "not-allowed") {
                setErrorMsg("Permissão de microfone negada.")
            } else {
                setErrorMsg("Não entendi o áudio. Tente novamente.")
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
    }, [isOpen])

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isProcessing])

    // Auto-start voice capture if requested
    useEffect(() => {
        if (isOpen && autoStartVoice && supportVoice) {
            const timer = setTimeout(() => {
                try {
                    recognitionRef.current?.start()
                } catch (e) {
                    console.error("Failed to autostart speech recognition", e)
                }
            }, 600); // Aguarda a animação do modal concluir
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoStartVoice, supportVoice])

    // Sync offline queue when coming back online
    useEffect(() => {
        const handleOnlineSync = async () => {
            const queue = JSON.parse(localStorage.getItem("offline-voice-queue") || "[]")
            if (queue.length === 0) return

            localStorage.removeItem("offline-voice-queue")

            // Process each item in sequence
            for (const item of queue) {
                try {
                    const isDemoMode = typeof window !== "undefined" && !localStorage.getItem("auth_token")
                    if (isDemoMode) {
                        const finMsg: Message = {
                            id: `fin-synced-${Date.now()}`,
                            text: `[Sincronizado offline]: Registrei a transação "${item.text}" no painel temporário. 🚀`,
                            sender: "fin",
                            timestamp: new Date()
                        }
                        setMessages(prev => [...prev, finMsg])
                        speakReply(`Sincronizado offline: ${item.text}`)
                    } else {
                        const response = await fetch("/api/agent/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ message: item.text }),
                        })
                        if (response.ok) {
                            const data = await response.json()
                            const finMsg: Message = {
                                id: `fin-synced-${Date.now()}`,
                                text: `[Sincronizado offline]: ${data.response}`,
                                sender: "fin",
                                timestamp: new Date()
                            }
                            setMessages(prev => [...prev, finMsg])
                            speakReply(`Sincronizado offline: ${data.response}`)
                        }
                    }
                } catch (err) {
                    console.error("Failed to sync offline voice item", item, err)
                }
            }

            if (onRefresh) {
                await onRefresh()
            }
        }

        if (typeof window !== "undefined") {
            window.addEventListener("online", handleOnlineSync)
            return () => window.removeEventListener("online", handleOnlineSync)
        }
    }, [onRefresh, isMuted])

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

    const handleSendMessage = async (textToSend: string) => {
        if (!textToSend.trim()) return

        // Check if offline
        if (typeof window !== "undefined" && !navigator.onLine) {
            const queue = JSON.parse(localStorage.getItem("offline-voice-queue") || "[]")
            queue.push({ id: `offline-${Date.now()}`, text: textToSend })
            localStorage.setItem("offline-voice-queue", JSON.stringify(queue))

            const userMsg: Message = {
                id: `user-${Date.now()}`,
                text: textToSend,
                sender: "user",
                timestamp: new Date()
            }
            const finMsg: Message = {
                id: `fin-offline-${Date.now()}`,
                text: `Você está offline no momento. Salvei o seu comando "${textToSend}" localmente e irei sincronizá-lo com o Fin assim que sua conexão de rede voltar! 📡`,
                sender: "fin",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, userMsg, finMsg])
            setTypedMessage("")
            setIsProcessing(false)
            speakReply("Sem conexão com a internet. Comando salvo localmente.")
            return
        }

        // 1. Add user message
        const userMsg: Message = {
            id: `user-${Date.now()}`,
            text: textToSend,
            sender: "user",
            timestamp: new Date()
        }
        setMessages(prev => [...prev, userMsg])
        setTypedMessage("")
        setIsProcessing(true)
        setErrorMsg(null)

        const isDemoMode = typeof window !== "undefined" && !localStorage.getItem("auth_token");
        if (isDemoMode) {
            // Wait for 1.2 seconds to simulate AI thinking
            setTimeout(async () => {
                let replyText = "Desculpe, não entendi o formato dessa transação. Você pode tentar algo como: 'Gastei R$ 40 com mercado' ou 'Recebi R$ 3000 de salário'.";
                const lowerText = textToSend.toLowerCase();
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
                    replyText = `Entendido! Processei o seu comando de voz/texto e registrei a transação com sucesso no seu painel temporário. 🚀\n\nDescrição: "${textToSend}"\n\n*(Lembre-se: em Modo de Demonstração as transações não são salvas permanentemente. Crie uma conta ou faça login para começar de verdade!)*`;
                }

                const finMsg: Message = {
                    id: `fin-${Date.now()}`,
                    text: replyText,
                    sender: "fin",
                    timestamp: new Date()
                }
                setMessages(prev => [...prev, finMsg])
                speakReply(replyText)
                setIsProcessing(false)
            }, 1200);
            return;
        }

        try {
            // 2. Query Gemini chat agent
            const response = await fetch("/api/agent/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: textToSend }),
            })

            if (!response.ok) {
                throw new Error("Erro de resposta do servidor")
            }

            const data = await response.json()
            
            // 3. Add Fin's reply
            const finMsg: Message = {
                id: `fin-${Date.now()}`,
                text: data.response,
                sender: "fin",
                timestamp: new Date()
            }
            setMessages(prev => [...prev, finMsg])

            // Speak response automatically
            speakReply(data.response)

            // Trigger sync of dashboard data
            if (onRefresh) {
                await onRefresh()
            }
        } catch (error) {
            console.error("Chat message process failure", error)
            setErrorMsg("Houve uma falha ao contatar o Fin. Tente de novo.")
        } finally {
            setIsProcessing(false)
        }
    }

    const speakReply = (textToSpeak: string) => {
        if (isMuted) return
        if (!("speechSynthesis" in window)) return
        window.speechSynthesis.cancel()

        // Clean markdown formatting like **bold** to prevent screen reader speaking asterisks literally
        const cleanText = textToSpeak
            .replace(/\*\*/g, "")
            .replace(/\*/g, "")
            .replace(/#/g, "")
            .replace(/-\s+/g, "")
            .trim()

        const utterance = new SpeechSynthesisUtterance(cleanText)
        utterance.lang = "pt-BR"
        window.speechSynthesis.speak(utterance)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
            {/* Main Chat Container: Full screen on mobile, WhatsApp size on desktop */}
            <div id="fin-chat-container" className="relative w-full h-full sm:max-w-md sm:h-[600px] sm:rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden transition-all">
                
                {/* Header (WhatsApp look-alike) */}
                <div className="bg-indigo-600 dark:bg-gray-800 text-white px-4 py-3 flex items-center justify-between border-b border-indigo-500/20 dark:border-gray-700/50 shadow-md">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose} 
                            className="p-1 hover:bg-white/10 rounded-full sm:hidden"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        {/* Avatar */}
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
                                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                            </div>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-indigo-600 dark:border-gray-800" />
                        </div>

                        <div>
                            <h4 className="font-bold text-sm leading-tight">Fin — Assistente Virtual</h4>
                            <p className="text-[10px] text-indigo-100 dark:text-gray-400 flex items-center gap-1">
                                {isProcessing ? "digitando..." : "online"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowShortcutInfo(true)}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1 text-[10px] font-semibold text-indigo-100 bg-white/5 border border-white/10 rounded-lg shadow-sm"
                            title="Configurar atalho Siri / Comando de Voz"
                        >
                            <Info className="w-3.5 h-3.5 text-indigo-200" />
                            <span>Atalho de Voz</span>
                        </button>
                        <button
                            onClick={() => setIsMuted(prev => !prev)}
                            className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-indigo-100 bg-white/5 border border-white/10 rounded-lg shadow-sm"
                            title={isMuted ? "Ativar som do Fin" : "Silenciar Fin"}
                        >
                            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-indigo-200" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-200" />}
                        </button>
                        <button 
                            onClick={onClose} 
                            className="hidden sm:block p-1.5 hover:bg-white/10 rounded-full transition-colors"
                            title="Fechar conversa"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Background decorative styling */}
                <div className="absolute inset-0 bg-repeat opacity-[0.03] pointer-events-none dark:opacity-[0.01]" 
                     style={{ backgroundImage: `url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075c.png')` }} 
                />

                {/* Messages Body Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10 flex flex-col scrollbar-thin">
                    {messages.length === 1 && messages[0].id === "welcome" ? (
                        <div className="my-auto flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800/60 rounded-3xl border border-gray-100 dark:border-gray-700/40 shadow-xl max-w-sm mx-auto animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl" />
                            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 rounded-full blur-xl" />
                            
                            <div className="relative mb-6">
                                <span className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md animate-ping" />
                                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg relative z-10">
                                    <Mic className="w-10 h-10 text-white animate-pulse" />
                                </div>
                            </div>

                            <h3 className="font-extrabold text-lg text-gray-800 dark:text-gray-100 mb-2">
                                Experimente o Fin por Voz!
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                Sou seu assistente de finanças. Fale um gasto ou ganho de forma natural e eu registro para você na hora, sem precisar digitar nada!
                            </p>

                            <div className="w-full space-y-2.5 mb-8">
                                <button
                                    onClick={() => handleSendMessage("Gastei R$ 45 com Uber hoje")}
                                    className="w-full text-left px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl transition-all flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 group"
                                >
                                    <span>🎙️ "Gastei R$ 45 com Uber hoje"</span>
                                    <Sparkles className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                </button>
                                <button
                                    onClick={() => handleSendMessage("Recebi R$ 2500 de salário")}
                                    className="w-full text-left px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-xl transition-all flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 group"
                                >
                                    <span>🎙️ "Recebi R$ 2500 de salário"</span>
                                    <Sparkles className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                </button>
                            </div>

                            <Button
                                onClick={toggleListening}
                                className="w-full py-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 group transition-all"
                            >
                                <Mic className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                                Começar a Falar
                            </Button>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm relative leading-relaxed transition-all ${
                                        msg.sender === "user"
                                            ? "bg-indigo-600 text-white rounded-tr-none"
                                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/50 rounded-tl-none"
                                    }`}
                                >
                                    <p className="whitespace-pre-line">{renderFormattedText(msg.text)}</p>
                                    
                                    <div className="flex justify-end items-center gap-1.5 mt-1.5 text-[9px] opacity-60">
                                        <span>
                                            {msg.timestamp.toLocaleTimeString("pt-BR", {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </span>
                                        {msg.sender === "fin" && (
                                            <button
                                                onClick={() => speakReply(msg.text)}
                                                className="hover:opacity-100 p-0.5 transition-opacity"
                                                title="Falar áudio"
                                            >
                                                <Volume2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Fin is writing loader */}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Fin está processando...</span>
                                <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                            </div>
                        </div>
                    )}

                    {/* Microphone status alert */}
                    {isListening && (
                        <div className="flex justify-center">
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 animate-pulse"
                            >
                                <span className="h-2 w-2 rounded-full bg-white" />
                                Gravando áudio... Fale agora
                            </motion.div>
                        </div>
                    )}

                    {/* Simple Error Alerts */}
                    {errorMsg && (
                        <div className="text-center">
                            <span className="inline-block bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-[10px] px-3 py-1 rounded-lg">
                                {errorMsg}
                            </span>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Bottom Input Area */}
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700/50 p-3 flex items-center gap-2 relative z-10">
                    {/* Keyboard text input field */}
                    <div className="flex-1 relative">
                        <input
                            id="fin-chat-input"
                            type="text"
                            placeholder="Mensagem"
                            value={typedMessage}
                            onChange={(e) => setTypedMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSendMessage(typedMessage)
                            }}
                            disabled={isProcessing || isListening}
                            className="w-full bg-gray-100 dark:bg-gray-900 border-0 focus:ring-0 focus:outline-none rounded-full h-11 px-4 text-xs text-gray-800 dark:text-gray-100 disabled:opacity-50"
                        />
                    </div>

                    {/* Microphone button */}
                    {supportVoice && (
                        <Button
                            id="fin-chat-mic-btn"
                            type="button"
                            onClick={toggleListening}
                            variant="ghost"
                            size="icon"
                            className={`h-11 w-11 rounded-full flex-shrink-0 transition-colors ${
                                isListening 
                                    ? "bg-red-500 text-white hover:bg-red-600" 
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                            title="Gravar por voz"
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>
                    )}

                    {/* Send button */}
                    <Button
                        id="fin-chat-send-btn"
                        type="button"
                        size="icon"
                        disabled={!typedMessage.trim() || isProcessing || isListening}
                        onClick={() => handleSendMessage(typedMessage)}
                        className="h-11 w-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex-shrink-0 shadow-md"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>

                {/* Voice Shortcut Configuration Overlay */}
                <AnimatePresence>
                    {showShortcutInfo && (
                        <motion.div 
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="absolute inset-0 z-20 bg-white dark:bg-gray-900 flex flex-col overflow-y-auto p-5"
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                                    Atalho de Voz no Celular
                                </h3>
                                <button 
                                    onClick={() => {
                                        setShowShortcutInfo(false)
                                        setCopied(false)
                                    }}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                Escolha uma das formas abaixo para falar com o Fin sem precisar abrir o app manualmente:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {/* Android Section */}
                                 <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                                     <div>
                                         <div className="flex items-center gap-2 mb-3">
                                             <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                                 <path d="M17.5 13c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5m-11 0c-.8 0-1.5-.7-1.5-1.5S5.7 10 6.5 10s1.5.7 1.5 1.5-.7 1.5-1.5 1.5m11.5-6.7l1.7-3c.1-.2.1-.5-.1-.6-.2-.1-.5-.1-.6.1l-1.8 3C15.7 5.3 13.9 5 12 5c-1.9 0-3.7.3-5.2.8L5 2.8c-.1-.2-.4-.2-.6-.1-.2.1-.2.4-.1.6l1.7 3C3.3 8.3 1.2 11.4 1 15h22c-.2-3.6-2.3-6.7-5-8.7z"/>
                                             </svg>
                                             <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Android (Google Assistente)</span>
                                         </div>
                                         <div className="space-y-3">
                                             <div className="flex gap-2">
                                                 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">1</span>
                                                 <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                                     Abra o aplicativo <strong className="font-bold">Google</strong>, acesse as <strong className="font-bold">Configurações</strong> e vá em <strong className="font-bold">Google Assistente</strong> &gt; <strong className="font-bold">Rotinas</strong>.
                                                 </p>
                                             </div>
                                             <div className="flex gap-2">
                                                 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">2</span>
                                                 <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                                     Crie uma nova rotina e adicione o comando de voz: <strong className="font-bold">"Fin me ajude"</strong>.
                                                 </p>
                                             </div>
                                             <div className="flex gap-2">
                                                 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">3</span>
                                                 <div className="flex-1 min-w-0">
                                                     <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                                         Em ações, adicione <strong className="font-bold">Abrir a URL</strong> e copie o endereço abaixo:
                                                     </p>
                                                     <div className="flex items-center gap-1.5 mt-1">
                                                         <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-[10px] break-all select-all flex-1 border border-gray-200 dark:border-gray-700">
                                                             {getVoiceUrl()}
                                                         </code>
                                                         <button
                                                             onClick={() => {
                                                                 const urlToCopy = getVoiceUrl();
                                                                 if (navigator.clipboard) {
                                                                     navigator.clipboard.writeText(urlToCopy);
                                                                     setCopiedUrl(true);
                                                                     setTimeout(() => setCopiedUrl(false), 2000);
                                                                 }
                                                             }}
                                                             className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-[10px] font-bold text-gray-700 dark:text-gray-200 rounded-lg flex items-center gap-1 shrink-0"
                                                         >
                                                             {copiedUrl ? (
                                                                 <>
                                                                     <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                                     <span className="text-emerald-500 font-bold">Copiado!</span>
                                                                 </>
                                                             ) : (
                                                                 <>
                                                                     <Copy className="w-3.5 h-3.5" />
                                                                     <span>COPIAR</span>
                                                                 </>
                                                             )}
                                                         </button>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                                         <a
                                             href="googleassistant://"
                                             className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-lg transition-colors text-center"
                                         >
                                             <span>Abrir Configurações do Assistente</span>
                                             <ExternalLink className="w-3.5 h-3.5" />
                                         </a>
                                         <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center font-medium">
                                             Fale "Ok Google, Fin me ajude" para ativar.
                                         </p>
                                     </div>
                                 </div>

                                 {/* iPhone Section */}
                                 <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                                     <div>
                                         <div className="flex items-center gap-2 mb-3">
                                             <svg className="w-5 h-5 text-gray-800 dark:text-gray-200" viewBox="0 0 24 24" fill="currentColor">
                                                 <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.26-.57 2.94-1.39z"/>
                                             </svg>
                                             <span className="text-xs font-bold text-gray-800 dark:text-gray-200">iOS / iPhone (Atalhos Siri)</span>
                                         </div>
                                         <div className="space-y-3 mb-4">
                                             <div className="flex gap-2">
                                                 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shrink-0">1</span>
                                                 <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                                     Copie a sua chave de acesso de segurança abaixo.
                                                 </p>
                                             </div>
                                             <div className="flex gap-2">
                                                 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shrink-0">2</span>
                                                 <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                                     Instale o atalho oficial da Siri pelo botão abaixo.
                                                 </p>
                                             </div>
                                             <div className="flex gap-2">
                                                 <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold shrink-0">3</span>
                                                 <p className="text-[11px] text-gray-600 dark:text-gray-400">
                                                     Cole a chave de acesso quando o atalho solicitar a configuração.
                                                 </p>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="flex flex-col gap-2">
                                         <button
                                             onClick={() => {
                                                 if (navigator.clipboard) {
                                                     navigator.clipboard.writeText(userId)
                                                     setCopied(true)
                                                     setTimeout(() => setCopied(false), 2000)
                                                 }
                                             }}
                                             className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                                         >
                                             {copied ? (
                                                 <>
                                                     <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                     <span className="text-emerald-500 font-bold">Chave Copiada!</span>
                                                 </>
                                             ) : (
                                                 <>
                                                     <Copy className="w-3.5 h-3.5" />
                                                     <span>Copiar Chave de Acesso</span>
                                                 </>
                                             )}
                                         </button>

                                         <a
                                             href="https://www.icloud.com/shortcuts/c7e8e74a88bc4d4eb0ea772412852277"
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg transition-colors text-center"
                                         >
                                             <span>Instalar Atalho Siri</span>
                                             <ExternalLink className="w-3.5 h-3.5" />
                                         </a>
                                     </div>
                                 </div>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}
