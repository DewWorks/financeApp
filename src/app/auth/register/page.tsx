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

    // Prosseguir com cadastro direto sem interrupção de WhatsApp
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

  const routerLogin = () => {
    router.push("/auth/login")
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center p-4">
        {/* Theme Toggle Absolute */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md bg-white dark:bg-card">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Title size="md" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border-2 border-border focus:border-blue-600"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 border-border focus:border-blue-600"
                  required
                />
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-2 border-border focus:border-blue-600"
                  required
                />
              </div>

              {/* Celular (Opcional) */}
              <div className="space-y-2">
                <Label className="text-lg flex items-center gap-2" htmlFor="cel">
                  Celular
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Opcional</span>
                </Label>
                <Input
                  id="cel"
                  type="tel"
                  value={cel}
                  onChange={handlePhoneChange}
                  className="border-2 border-border focus:border-blue-600"
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground">💡 Receba lembretes e fale com a IA direto no App</p>
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

    </>
  )
}
