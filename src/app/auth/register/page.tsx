"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from "@/components/ui/molecules/Title"
import { MessageCircle, Bot, Zap, BarChart3, Clock, X, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [cel, setCel] = useState("")
  const [password, setPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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

    // Validar Termos
    if (!termsAccepted) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Você precisa aceitar os Termos de Uso para criar sua conta.",
        confirmButtonColor: "#3b82f6"
      })
      return
    }

    // Se não tem celular, mostrar modal de benefícios
    if (!cel.trim()) {
      setShowWhatsAppModal(true)
      return
    }

    // Prosseguir com cadastro
    await performRegistration()
  }

  const performRegistration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, cel, termsAccepted }),
      })

      const data = await response.json()

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
        console.error("Registration API Error:", data)
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: data.error || data.message || "Erro ao realizar cadastro.",
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
    } finally {
      setIsLoading(false)
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="flex items-center justify-center">
            <Title />
            <CardTitle className="text-2xl font-bold text-center">Cadastro</CardTitle>
            <p className="text-center text-muted-foreground text-sm mt-1">Crie sua conta no FinancePro</p>
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
                  className="border-2 border-border focus:border-blue-500"
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
                  className="border-2 border-border focus:border-blue-500"
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
                  className="border-2 border-border focus:border-blue-500"
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
                  className="border-2 border-border focus:border-green-500"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground">💡 Controle seus gastos por mensagem com nossa IA</p>
              </div>

              {/* Termos de Uso */}
              <div className="flex items-start space-x-2 pt-2">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div className="ml-2 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-900 dark:text-gray-300">
                    Eu concordo com os <a href="/terms" target="_blank" className="text-blue-600 hover:underline dark:text-blue-500">Termos de Uso</a>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">É obrigatório aceitar para criar sua conta.</p>
                </div>
              </div>

              {/* Botão Cadastrar */}
              <Button
                type="submit"
                className="w-full text-lg bg-blue-600 hover:bg-blue-700 text-white mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>

              {/* Divisor */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Login */}
              <div className="text-center space-y-3">
                <h2 className="text-lg text-foreground">Já tem uma conta?</h2>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white dark:bg-card">
            <CardHeader className="relative">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-3 mb-2">
                <MessageCircle className="w-8 h-8 text-green-500" />
                <Title size="md" />
              </div>
              <CardTitle className="text-xl font-bold text-center">WhatsApp + FinancePro IA</CardTitle>
              <p className="text-center text-muted-foreground text-sm">Tem certeza que não quer conectar seu WhatsApp?</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Benefícios */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Bot className="w-6 h-6 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-400">IA Automática</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Gastei 30 reais no Uber → Registra automaticamente como transporte
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-400">Super Rápido</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Registre gastos em segundos, sem abrir o app</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-purple-800 dark:text-purple-400">Relatórios Instantâneos</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Quanto gastei essa semana? → Resposta na hora</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-800 dark:text-orange-400">Sempre Disponível</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">24/7 no seu WhatsApp, onde você já está</p>
                  </div>
                </div>
              </div>

              {/* Demonstração */}
              <div className="bg-muted rounded-lg p-3">
                <h4 className="font-semibold text-foreground mb-2">💬 Exemplo de uso:</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-green-500 text-white p-2 rounded-lg rounded-br-none max-w-xs ml-auto">
                    Almoçei, foram 25 reais
                  </div>
                  <div className="bg-white dark:bg-card p-2 rounded-lg rounded-bl-none max-w-xs shadow-sm">
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
                  className="border-gray-300 dark:border-gray-700 text-foreground hover:bg-accent bg-transparent"
                >
                  Continuar sem WhatsApp
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-2">
                💡 Você pode conectar o WhatsApp depois nas configurações
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
