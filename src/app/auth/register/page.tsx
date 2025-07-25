"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from "@/components/ui/molecules/Title"
import { MessageCircle, Bot, Zap, BarChart3, Clock, X } from "lucide-react"
import Swal from "sweetalert2"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [cel, setCel] = useState("")
  const [password, setPassword] = useState("")
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const router = useRouter()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Se não tem celular, mostrar modal de benefícios
    if (!cel.trim()) {
      setShowWhatsAppModal(true)
      return
    }

    // Prosseguir com cadastro
    await performRegistration()
  }

  const performRegistration = async () => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, cel }),
      })

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Cadastro realizado com sucesso.",
          confirmButtonText: "Entrar",
          timer: 3000,
        }).then(() => {
          router.push("/auth/login")
        })
      } else {
        const errorData = await response.json()
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorData.message || "Erro ao realizar cadastro.",
        })
      }
    } catch (error: unknown) {
      console.error("Erro ao cadastrar:", error)
      let errorMessage = "Ocorreu um erro ao tentar cadastrar. Por favor, tente novamente."
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      }
      Swal.fire({
        icon: "error",
        title: "Erro inesperado!",
        text: errorMessage,
      })
    }
  }

  const handleContinueWithoutWhatsApp = () => {
    setShowWhatsAppModal(false)
    performRegistration()
  }

  const handleAddWhatsApp = () => {
    setShowWhatsAppModal(false)
    // Focar no campo de telefone
    document.getElementById("cel")?.focus()
  }

  const routerLogin = () => {
    router.push("/auth/login")
  }

  return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <Card className="w-full max-w-md">
            <CardHeader className="flex items-center justify-center">
              <Title />
              <CardTitle className="text-2xl font-bold text-center">Cadastro</CardTitle>
              <p className="text-center text-gray-600 text-sm mt-1">Crie sua conta no FinancePro</p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div className="space-y-2">
                  <Label className="text-lg" htmlFor="name">
                    Nome
                  </Label>
                  <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border-2 border-slate-300 focus:border-blue-500"
                      placeholder="Seu nome completo"
                      required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-lg" htmlFor="email">
                    Email
                  </Label>
                  <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-2 border-slate-300 focus:border-blue-500"
                      placeholder="email@exemplo.com"
                      required
                  />
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <Label className="text-lg" htmlFor="password">
                    Senha
                  </Label>
                  <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-2 border-slate-300 focus:border-blue-500"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                  />
                </div>

                {/* WhatsApp (Opcional) */}
                <div className="space-y-2">
                  <Label className="text-lg flex items-center gap-2" htmlFor="cel">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    WhatsApp
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Opcional</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">IA</span>
                  </Label>
                  <Input
                      id="cel"
                      type="tel"
                      value={cel}
                      onChange={handlePhoneChange}
                      className="border-2 border-slate-300 focus:border-green-500"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                  />
                  <p className="text-xs text-gray-500">💡 Controle seus gastos por mensagem com nossa IA</p>
                </div>

                {/* Botão Cadastrar */}
                <Button type="submit" className="w-full text-lg bg-blue-600 hover:bg-blue-700 text-white mt-6">
                  Cadastrar
                </Button>

                {/* Divisor */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-100 px-2 text-gray-500">ou</span>
                  </div>
                </div>

                {/* Login */}
                <div className="text-center space-y-3">
                  <h2 className="text-lg text-gray-700">Já tem uma conta?</h2>
                  <Button
                      onClick={routerLogin}
                      className="w-full text-lg bg-green-600 hover:bg-green-700 text-white"
                      type="button"
                  >
                    Fazer login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Modal de Benefícios do WhatsApp */}
        {showWhatsAppModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-lg bg-white">
                <CardHeader className="relative">
                  <button
                      onClick={() => setShowWhatsAppModal(false)}
                      className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center justify-center gap-3 mb-2">
                    <MessageCircle className="w-8 h-8 text-green-500" />
                    <Title size="md" />
                  </div>
                  <CardTitle className="text-xl font-bold text-center">WhatsApp + FinancePro IA</CardTitle>
                  <p className="text-center text-gray-600 text-sm">Tem certeza que não quer conectar seu WhatsApp?</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Benefícios */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                      <Bot className="w-6 h-6 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-800">IA Automática</h4>
                        <p className="text-sm text-green-700">
                          Gastei 30 reais no Uber → Registra automaticamente como transporte
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Super Rápido</h4>
                        <p className="text-sm text-blue-700">Registre gastos em segundos, sem abrir o app</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-purple-800">Relatórios Instantâneos</h4>
                        <p className="text-sm text-purple-700">Quanto gastei essa semana? → Resposta na hora</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-orange-800">Sempre Disponível</h4>
                        <p className="text-sm text-orange-700">24/7 no seu WhatsApp, onde você já está</p>
                      </div>
                    </div>
                  </div>

                  {/* Demonstração */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-semibold text-gray-800 mb-2">💬 Exemplo de uso:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="bg-green-500 text-white p-2 rounded-lg rounded-br-none max-w-xs ml-auto">
                        Almoçei, foram 25 reais
                      </div>
                      <div className="bg-white p-2 rounded-lg rounded-bl-none max-w-xs shadow-sm">
                        ✅ Registrei R$ 25,00 em Alimentação. Seu gasto hoje: R$ 25,00
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="grid grid-cols-1 gap-3 pt-4">
                    <Button
                        onClick={handleAddWhatsApp}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Adicionar WhatsApp
                    </Button>
                    <Button
                        onClick={handleContinueWithoutWhatsApp}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                    >
                      Continuar sem WhatsApp
                    </Button>
                  </div>

                  <p className="text-xs text-center text-gray-500 mt-2">
                    💡 Você pode conectar o WhatsApp depois nas configurações
                  </p>
                </CardContent>
              </Card>
            </div>
        )}
      </>
  )
}
