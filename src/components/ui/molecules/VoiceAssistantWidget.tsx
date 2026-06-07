"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Send, Volume2, Sparkles, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/atoms/button"

interface VoiceAssistantWidgetProps {
    onRefresh: () => Promise<void>;
}

export function VoiceAssistantWidget({ onRefresh }: VoiceAssistantWidgetProps) {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [reply, setReply] = useState<string | null>(null)
    const [supportVoice, setSupportVoice] = useState(true)
    const [typedMessage, setTypedMessage] = useState("")
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        // Check Web Speech API Support
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
            processMessage(speechText)
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

    const processMessage = async (messageText: string) => {
        if (!messageText.trim()) return

        setIsProcessing(true)
        setReply(null)
        setErrorMsg(null)

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
            
            // If the voice registration modified data, reload dashboard
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
        processMessage(msg)
    }

    const speakReply = () => {
        if (!reply || !("speechSynthesis" in window)) return
        window.speechSynthesis.cancel() // Stop previous audio
        const utterance = new SpeechSynthesisUtterance(reply)
        utterance.lang = "pt-BR"
        window.speechSynthesis.speak(utterance)
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6 flex flex-col justify-between h-full min-h-[200px]">
            {/* Background decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-xl pointer-events-none" />

            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                Assistente por Voz "Fin"
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                Diga o que gastou/recebeu para salvar na hora
                            </p>
                        </div>
                    </div>
                    {supportVoice ? (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                            Voz Ativa
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 px-2 py-0.5 rounded-full">
                            Teclado
                        </span>
                    )}
                </div>

                {/* Display Area */}
                <div className="min-h-[64px] flex flex-col justify-center mb-4">
                    <AnimatePresence mode="wait">
                        {isListening && (
                            <motion.div
                                key="listening"
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
                                key="processing"
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
                                key="transcript"
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
                                key="reply"
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
                                key="error"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs text-red-500 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 p-2.5 rounded-xl border border-red-100/20 dark:border-red-900/20 text-center font-medium"
                            >
                                {errorMsg}
                            </motion.div>
                        )}

                        {!isListening && !isProcessing && !transcript && !reply && !errorMsg && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-xs text-gray-400 dark:text-gray-500 py-3 italic"
                            >
                                Ex: "Gastei 45 reais com almoço no iFood hoje"
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Interaction Row */}
            <div className="flex gap-2 items-center mt-2">
                {supportVoice ? (
                    <Button
                        type="button"
                        onClick={toggleListening}
                        className={`flex-1 rounded-xl h-11 font-bold text-white transition-all duration-300 relative overflow-hidden flex items-center justify-center gap-2 ${
                            isListening
                                ? "bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20"
                                : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-500/20"
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

                {/* Keyboard fallback input */}
                <div className={`flex gap-2 items-center ${supportVoice ? "w-1/2" : "w-full"}`}>
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
                        className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
