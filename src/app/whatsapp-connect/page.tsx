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
import { MessageCircle, Bot } from "lucide-react"
import Swal from "sweetalert2"

interface Message {
    id: number
    text: string
    isUser: boolean
    isVisible: boolean
}

export default function WhatsAppConnectPage() {
    const [cel, setCel] = useState("")
    const [loading, setLoading] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [showDemo, setShowDemo] = useState(false)
    const [showModal, setShowModal] = useState(false)
    
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
        const timer = setTimeout(() => setShowDemo(true), 1000)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (!showDemo) return

        const showMessages = async () => {
            for (let i = 0; i < conversationFlow.length; i++) {
                await new Promise((resolve) => setTimeout(resolve, 1500))
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await axios.patch("/api/users", { cel })

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "WhatsApp conectado com sucesso!",
                    confirmButtonText: "Continuar",
                    timer: 3000,
                }).then(() => {
                    router.push("/")
                })
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao conectar o Whatsapp!";
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/\D/g, "")
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
        }
        return value
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value)
        setCel(formatted)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <MessageCircle className="w-8 h-8 text-green-500" />
                        <Title />
                    </div>
                    <CardTitle className="text-2xl font-bold">WhatsApp + FinancePro</CardTitle>
                    <div className="flex items-center justify-center gap-2 mt-2">
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">BETA</span>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium">NOVO</span>
                    </div>
                    <p className="text-gray-600 mt-2">Controle seus gastos conversando naturalmente pelo WhatsApp</p>
                    <p className="text-blue-600 underline font-medium mt-2">Em breve...</p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-base font-medium">
                                Número do WhatsApp
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={cel}
                                onChange={handlePhoneChange}
                                className="border-2 border-slate-300 focus:border-blue-500"
                                placeholder="(11) 99999-9999"
                                maxLength={15}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                                {loading ? "Conectando..." : "Conectar WhatsApp"}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setShowModal(true)}
                                variant="outline"
                                className="border-gray-300"
                            >
                                Pular por Agora
                            </Button>
                            {showModal && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                                    <div className="bg-white rounded-xl max-w-md w-full p-6 transform animate-scale-in">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                <MessageCircle className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Tem certeza?</h3>
                                            <p className="text-gray-600">Você está perdendo benefícios incríveis!</p>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg transform hover:scale-105 transition-transform duration-200">
                                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">⚡</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-green-800">Controle Instantâneo</h4>
                                                    <p className="text-sm text-green-600">Lance gastos em segundos pelo WhatsApp</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg transform hover:scale-105 transition-transform duration-200">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <Bot className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-blue-800">IA Inteligente</h4>
                                                    <p className="text-sm text-blue-600">Categorização automática dos seus gastos</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg transform hover:scale-105 transition-transform duration-200">
                                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-sm font-bold">📊</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-purple-800">Relatórios Automáticos</h4>
                                                    <p className="text-sm text-purple-600">Receba resumos semanais por WhatsApp</p>
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
                                                className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                                            >
                                                Continuar sem conectar
                                            </Button>
                                        </div>

                                        <p className="text-xs text-center text-gray-500 mt-4">
                                            💡 Você pode conectar depois nas configurações
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Demonstração da Conversa */}
                    <div className="border-t pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Bot className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-800">Demonstração ao vivo:</h3>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto">
                            <div className="space-y-3">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                                    >
                                        <div
                                            className={`max-w-xs lg:max-w-sm p-3 rounded-lg ${
                                                message.isUser
                                                    ? "bg-green-500 text-white rounded-br-none"
                                                    : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                                            }`}
                                        >
                                            {!message.isUser && (
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Bot className="w-3 h-3 text-blue-600" />
                                                    <span className="text-xs font-medium text-blue-600">FinancePro</span>
                                                </div>
                                            )}
                                            <p className="text-sm">{message.text}</p>
                                        </div>
                                    </div>
                                ))}

                                {messages.length === 0 && showDemo && (
                                    <div className="flex justify-center items-center h-32">
                                        <div className="flex items-center gap-2 text-gray-500">
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

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">
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
      `}</style>
        </div>
    )
}
