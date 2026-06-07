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
    ArrowLeft
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
}

export function FinChatDialog({ isOpen, onClose, onRefresh }: FinChatDialogProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [isListening, setIsListening] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [typedMessage, setTypedMessage] = useState("")
    const [supportVoice, setSupportVoice] = useState(true)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    
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
            <div className="relative w-full h-full sm:max-w-md sm:h-[600px] sm:rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col overflow-hidden transition-all">
                
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

                    <button 
                        onClick={onClose} 
                        className="hidden sm:block p-1.5 hover:bg-white/10 rounded-full transition-colors"
                        title="Fechar conversa"
                    >
                        <X className="w-5 h-5" />
                    </button>
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
                                <p className="whitespace-pre-line">{msg.text}</p>
                                
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
                        type="button"
                        size="icon"
                        disabled={!typedMessage.trim() || isProcessing || isListening}
                        onClick={() => handleSendMessage(typedMessage)}
                        className="h-11 w-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 flex-shrink-0 shadow-md"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>

            </div>
        </div>
    )
}
