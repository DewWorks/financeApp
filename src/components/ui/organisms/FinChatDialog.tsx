"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    X, 
    Send, 
    Mic, 
    MicOff, 
    Volume2, 
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
        if (!("speechSynthesis" in window)) return
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(textToSpeak)
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
                    {messages.map((msg) => (
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
                                            <Volume2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

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

                            <div className="space-y-4">
                                {/* Option 1: Native PWA Shortcut */}
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md mb-2">
                                        Método 1: Atalho do Ícone (Sem Configurar Nada)
                                    </span>
                                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                                        Pressione e Segure o Ícone
                                    </h4>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal">
                                        Na tela inicial do seu celular, **pressione e segure o ícone** do FinancePro. Um menu se abrirá com a opção **"Falar com o Fin 🎙️"**. Toque nela e o app abrirá gravando seu áudio instantaneamente!
                                    </p>
                                </div>

                                {/* Option 2: Google Assistant (Android) */}
                                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100/30 dark:border-emerald-950/30">
                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md mb-2">
                                        Método 2: Google Assistente (Android - Mãos Livres)
                                    </span>
                                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                                        Chame "Ok Google, Fin me ajude" com o app fechado
                                    </h4>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal mb-2">
                                        Você pode configurar o Google Assistente para abrir a voz mesmo com o celular bloqueado ou app fechado:
                                    </p>
                                    <ol className="text-[10px] text-gray-600 dark:text-gray-400 space-y-1 list-decimal pl-4 mb-2">
                                        <li>Abra o app **Google** → toque no seu avatar → **Configurações** → **Google Assistente** → **Rotinas**.</li>
                                        <li>Toque em **Nova** e adicione o comando: *"Fin me ajude"* ou *"Registrar no Fin"*.</li>
                                        <li>Em ações, adicione: **Abrir a URL**: `https://finance-pro-mu.vercel.app/?startVoice=true`</li>
                                    </ol>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        Pronto! Basta dizer "Ok Google, Fin me ajude" para o celular abrir o app e iniciar a captura na hora.
                                    </p>
                                </div>

                                {/* Option 3: Siri Shortcut integration */}
                                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100/30 dark:border-indigo-950/30">
                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md mb-2">
                                        Método 3: Atalho Siri (iPhone - Mãos Livres)
                                    </span>
                                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                                        Registrar por Voz por Comando da Siri
                                    </h4>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal mb-3">
                                        Copie seu token de segurança e instale nosso Atalho da Siri oficial. Você poderá apenas dizer *"E aí Siri, Registrar Gasto"* para cadastrar em segundo plano!
                                    </p>

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
                                                    <span className="text-emerald-500">Chave Copiada!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5" />
                                                    <span>1. Copiar Chave de Acesso</span>
                                                </>
                                            )}
                                        </button>

                                        <a
                                            href="https://www.icloud.com/shortcuts/c7e8e74a88bc4d4eb0ea772412852277"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg transition-colors text-center"
                                        >
                                            <span>2. Instalar Atalho Siri</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                    <p className="text-[9px] text-indigo-400/80 dark:text-indigo-500/70 mt-2 text-center">
                                        *Ao instalar, cole a Chave de Acesso quando solicitado pelo app Atalhos.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    )
}
