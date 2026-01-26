"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from "@/components/ui/molecules/Title"
import { MessageCircle, Bot, CheckCircle, Phone, Wifi, ChevronLeft } from "lucide-react"
import Swal from "sweetalert2"
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle"
import { usePlanGate } from "@/context/PlanGateContext"
import { PlanType } from "@/interfaces/IUser"

interface Message {
    id: number
    text: string
    isUser: boolean
    isVisible: boolean
}

interface User {
    _id: string
    name: string
    email: string
    cel: string[]
}

export default function WhatsAppConnectPage() {
    const [cel, setCel] = useState("")
    const [loading, setLoading] = useState(false)
    const [userLoading, setUserLoading] = useState(true)
    const [user, setUser] = useState<User | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [showDemo, setShowDemo] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const { checkFeature, openUpgradeModal } = usePlanGate()

    const router = useRouter()

    const conversationFlow = [
        { text: "Gastei 30 reais no Uber hoje", isUser: true },
        { text: "Entendi! Registrei R$ 30,00 em Transporte. Seu gasto total hoje é R$ 30,00.", isUser: false },
        { text: "Comprei no mercado, foram 85 reais", isUser: true },
        { text: "Perfeito! Adicionei R$ 85,00 em Alimentação. Total do dia: R$ 115,00.", isUser: false },
        { text: "Quanto gastei essa semana?", isUser: true },
        {
            text: "Esta semana você gastou R$ 340,00. Principais categorias: Alimentação (45%) e Transporte (25%).",
            isUser: false,
        },
    ]

    useEffect(() => {
        fetchUserData()
        const timer = setTimeout(() => setShowDemo(true), 500)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!showDemo) return

        const showMessages = async () => {
            for (let i = 0; i < conversationFlow.length; i++) {
                await new Promise((resolve) => setTimeout(resolve, 1000))
                setMessages((prev) => [
                    ...prev,
                    {
                        id: i,
                        text: conversationFlow[i].text,
                        isUser: conversationFlow[i].isUser,
                        isVisible: true,
                    },
                ])
            }
        }

        showMessages()
    }, [showDemo])

    const fetchUserData = async () => {
        try {
            const response = await axios.get("/api/users")
            if (response.status === 200) {
                const userData = response.data
                setUser(userData)

                // Verificar se já tem telefone conectado
                if (userData.cel && userData.cel.length > 0) {
                    const phoneNumber = userData.cel[0]
                    setCel(formatPhoneNumber(phoneNumber))
                    setIsConnected(true)
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error)
        } finally {
            setUserLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Normalizar telefone
            let formattedPhone = cel.replace(/\D/g, "")
            if (formattedPhone.length > 0) {
                // Se não começar com 55 (e tiver tamanho de número local), adiciona
                // Assumindo número local com 10 ou 11 dígitos (DDD + número)
                if (!formattedPhone.startsWith("55") && formattedPhone.length <= 11) {
                    formattedPhone = `+55${formattedPhone}`
                } else {
                    formattedPhone = `+${formattedPhone}`
                }
            }

            const response = await axios.patch("/api/users", { cel: [formattedPhone] })

            if (response.status === 200) {
                setIsConnected(true)
                Swal.fire({
                    icon: "success",
                    title: "WhatsApp Conectado!",
                    html: `
                        <div style="text-align: center;">
                            <div style="font-size: 48px; margin: 20px 0;">📱</div>
                            <p><strong>Número conectado:</strong> ${formattedPhone}</p>
                            <p style="color: #10B981; font-weight: 600;">✅ Pronto para usar!</p>
                            <hr style="margin: 20px 0;">
                            <p style="color: #666; font-size: 14px;">
                                Agora você pode enviar seus gastos diretamente pelo WhatsApp!
                            </p>
                        </div>
                    `,
                    confirmButtonText: "Ir para Dashboard",
                    timer: 5000,
                }).then(() => {
                    router.push("/")
                })
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } }
            const errorMessage = err.response?.data?.error || "Erro ao conectar o WhatsApp!"
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async () => {
        const result = await Swal.fire({
            title: "Desconectar WhatsApp?",
            text: "Você não poderá mais enviar gastos pelo WhatsApp até reconectar.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sim, desconectar",
            cancelButtonText: "Cancelar",
        })

        if (result.isConfirmed) {
            try {
                setLoading(true)
                const response = await axios.patch("/api/users", { cel: [] })

                if (response.status === 200) {
                    setIsConnected(false)
                    setCel("")
                    Swal.fire({
                        icon: "success",
                        title: "WhatsApp Desconectado!",
                        text: "Você pode reconectar a qualquer momento.",
                        timer: 3000,
                    })
                }
            } catch (error: unknown) {
                const err = error as { response?: { data?: { error?: string } } };
                const errorMessage = err.response?.data?.error || "Erro ao desconectar WhatsApp.";
                Swal.fire({
                    icon: "error",
                    title: "Erro!",
                    text: errorMessage || "Erro ao desconectar WhatsApp.",
                })
            } finally {
                setLoading(false)
            }
        }
    }

    const formatPhoneNumber = (value: string) => {
        const hasPlus = value.startsWith("+")
        const numbers = value.replace(/\D/g, "")

        if (hasPlus) {
            return value
        }

        if (numbers.length <= 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
        }
        return value
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value)
        setCel(formatted)
    }

    if (userLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Carregando informações...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background p-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="absolute top-4 left-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => router.push('/')}
                >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="hidden sm:inline">Voltar</span>
                </Button>
            </div>
            <Card className="w-full max-w-2xl bg-card">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <MessageCircle className="w-8 h-8 text-green-500" />
                        <Title />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">WhatsApp + FinancePro</CardTitle>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-1 rounded-md font-medium">BETA</span>
                        <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs px-2 py-1 rounded-md font-medium">NOVO</span>
                        {isConnected && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                                <Wifi className="w-3 h-3" />
                                CONECTADO
                            </span>
                        )}
                    </div>
                    <p className="text-muted-foreground mt-2">
                        {isConnected
                            ? `Olá ${user?.name}! Seu WhatsApp está conectado e pronto para usar.`
                            : "Controle seus gastos conversando naturalmente pelo WhatsApp"}
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Status de Conexão */}
                    {isConnected && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-green-800 dark:text-green-400">WhatsApp Conectado!</h3>
                                    <p className="text-sm text-green-600 dark:text-green-300">
                                        Número: <span className="font-medium">{cel}</span>
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-300 mt-1">✅ Pronto para receber seus gastos via WhatsApp</p>
                                </div>
                                <Button
                                    onClick={handleDisconnect}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 bg-transparent"
                                >
                                    Desconectar
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Formulário ou Call to Action para Upgrade */}
                    {checkFeature('WHATSAPP') ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2 text-foreground">
                                    <Phone className="w-4 h-4" />
                                    Número do WhatsApp
                                    {isConnected && <CheckCircle className="w-4 h-4 text-green-500" />}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={cel}
                                        onChange={handlePhoneChange}
                                        className={`border-2 pr-10 ${isConnected
                                            ? "border-green-300 bg-green-50 dark:bg-green-900/20 focus:border-green-500"
                                            : "border-border focus:border-blue-500"
                                            }`}
                                        placeholder="(11) 99999-9999"
                                        maxLength={15}
                                        required
                                    />
                                    {isConnected && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {isConnected && (
                                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <Wifi className="w-3 h-3" />
                                        Conectado
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    onClick={() => (isConnected ? router.push("/") : setShowModal(true))}
                                    variant="outline"
                                    className="border-border text-foreground hover:bg-accent"
                                >
                                    {isConnected ? "Voltar" : "Pular por Agora"}
                                </Button>
                                <Button
                                    type="submit"
                                    className={`${isConnected ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                                        } text-white`}
                                    disabled={loading}
                                >
                                    {loading ? "Processando..." : isConnected ? "Atualizar WhatsApp" : "Conectar WhatsApp"}
                                </Button>

                                {showModal && (
                                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                                        <div className="bg-white dark:bg-card border border-border rounded-xl max-w-md w-full p-6 transform animate-scale-in">
                                            <div className="text-center mb-6">
                                                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                    <MessageCircle className="w-8 h-8 text-white" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-foreground mb-2">Tem certeza?</h3>
                                                <p className="text-muted-foreground">Você está perdendo benefícios incríveis!</p>
                                            </div>

                                            <div className="space-y-4 mb-6">
                                                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg transform hover:scale-105 transition-transform duration-200">
                                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">⚡</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-green-800 dark:text-green-400">Controle Instantâneo</h4>
                                                        <p className="text-sm text-green-600 dark:text-green-300">Lance gastos em segundos pelo WhatsApp</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg transform hover:scale-105 transition-transform duration-200">
                                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <Bot className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-blue-800 dark:text-blue-400">IA Inteligente</h4>
                                                        <p className="text-sm text-blue-600 dark:text-blue-300">Categorização automática dos seus gastos</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg transform hover:scale-105 transition-transform duration-200">
                                                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                                        <span className="text-white text-sm font-bold">📊</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-purple-800 dark:text-purple-400">Relatórios Automáticos</h4>
                                                        <p className="text-sm text-purple-600 dark:text-purple-300">Receba resumos semanais por WhatsApp</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Button
                                                    onClick={() => setShowModal(false)}
                                                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                                >
                                                    🚀 Voltar e Conectar WhatsApp
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        setShowModal(false)
                                                        router.push("/")
                                                    }}
                                                    variant="outline"
                                                    className="w-full border-border text-muted-foreground hover:bg-accent"
                                                >
                                                    Continuar sem conectar
                                                </Button>
                                            </div>

                                            <p className="text-xs text-center text-muted-foreground mt-4">
                                                💡 Você pode conectar depois nas configurações
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    ) : (
                        // BLOQUEIO PARA PLANO FREE - CTA DE UPGRADE
                        <div className="border border-blue-500/30 bg-gradient-to-br from-slate-900 to-blue-950 rounded-xl p-8 text-center space-y-6 relative overflow-hidden shadow-2xl">
                            {/* Background Effects */}
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Bot size={120} className="text-blue-400" />
                            </div>
                            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/20 blur-[50px] rounded-full pointing-events-none"></div>

                            <div className="flex justify-center relative z-10">
                                <span className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider shadow-sm">
                                    Funcionalidade PRO
                                </span>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Desbloqueie o Bot de WhatsApp
                                </h3>

                                <p className="text-blue-100/70 text-sm max-w-sm mx-auto leading-relaxed">
                                    Pare de perder tempo digitando manualmente. Com o plano PRO, você envia um áudio ou texto e nossa IA registra tudo.
                                </p>
                            </div>

                            <div className="grid gap-3 max-w-xs mx-auto text-left text-sm text-gray-300 py-2 relative z-10">
                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <div className="bg-green-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-green-400" /></div>
                                    <span>Lançamentos por Áudio/Texto</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <div className="bg-blue-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-blue-400" /></div>
                                    <span>Categorização via IA</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <div className="bg-purple-500/20 p-1 rounded-full"><CheckCircle size={14} className="text-purple-400" /></div>
                                    <span>Relatórios Semanais Automáticos</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-12 shadow-lg hover:shadow-blue-500/25 transition-all transform hover:scale-[1.02] active:scale-95 border border-blue-400/20"
                                onClick={() => openUpgradeModal("Tenha o controle financeiro na palma da mão com nosso Bot de WhatsApp exclusivo!", 'PRO')}
                            >
                                Fazer Upgrade Agora 🚀
                            </Button>
                            <p className="text-xs text-blue-300/50 mt-2">
                                A partir de R$ 19,90/mês
                            </p>
                        </div>
                    )}
                    <div className="border-t border-border pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Bot className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-foreground">Demonstração ao vivo:</h3>
                        </div>

                        <div className="bg-muted rounded-lg p-4 h-80 overflow-y-auto">
                            <div className="space-y-3">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-sm p-3 rounded-lg ${message.isUser
                                                ? "bg-green-500 text-white rounded-br-none"
                                                : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 rounded-bl-none shadow-sm"
                                                }`}
                                        >
                                            {!message.isUser && (
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Bot className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">FinancePro</span>
                                                </div>
                                            )}
                                            <p className="text-sm">{message.text}</p>
                                        </div>
                                    </div>
                                ))}

                                {messages.length === 0 && showDemo && (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div
                                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                style={{ animationDelay: "0.1s" }}
                                            ></div>
                                            <div
                                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                style={{ animationDelay: "0.2s" }}
                                            ></div>
                                            <span className="ml-2 text-sm">Iniciando demonstração...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Como funciona:</strong> Converse naturalmente sobre seus gastos. Nossa IA entende e registra
                                automaticamente no seu FinancePro!
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }
            `}</style>
        </div>
    )
}
