"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from "@/components/ui/molecules/Title"
import { Mail, Phone, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import Swal from "sweetalert2"

type InputValidation = {
  type: "email" | "phone" | "unknown"
  isValid: boolean
  isComplete: boolean
  message: string
}

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [validation, setValidation] = useState<InputValidation>({
    type: "unknown",
    isValid: false,
    isComplete: false,
    message: "",
  })
  const router = useRouter()

  // Validação mais robusta de email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email)
    const hasAt = email.includes("@")
    const hasDot = email.includes(".")
    const parts = email.split("@")

    if (!hasAt) {
      return { isValid: false, isComplete: false, message: "Digite um email válido" }
    }

    if (parts.length === 2 && parts[1] && !hasDot) {
      return { isValid: false, isComplete: false, message: "Adicione a extensão (.com, .br, etc.)" }
    }

    if (isValid) {
      return { isValid: true, isComplete: true, message: "Email válido ✓" }
    }

    return { isValid: false, isComplete: false, message: "Formato de email inválido" }
  }

  // Validação mais robusta de telefone
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, "")

    if (numbers.length === 0) {
      return { isValid: false, isComplete: false, message: "Digite um telefone" }
    }

    if (numbers.length < 10) {
      return { isValid: false, isComplete: false, message: "Telefone incompleto" }
    }

    if (numbers.length === 10) {
      return { isValid: false, isComplete: false, message: "Adicione o 9º dígito" }
    }

    if (numbers.length === 11) {
      const ddd = numbers.substring(0, 2)
      const ninthDigit = numbers.substring(2, 3)

      const validDDDs = [
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19", // SP
        "21",
        "22",
        "24", // RJ
        "27",
        "28", // ES
        "31",
        "32",
        "33",
        "34",
        "35",
        "37",
        "38", // MG
        "41",
        "42",
        "43",
        "44",
        "45",
        "46", // PR
        "47",
        "48",
        "49", // SC
        "51",
        "53",
        "54",
        "55", // RS
        "61", // DF
        "62",
        "64", // GO
        "63", // TO
        "65",
        "66", // MT
        "67", // MS
        "68", // AC
        "69", // RO
        "71",
        "73",
        "74",
        "75",
        "77", // BA
        "79", // SE
        "81",
        "87", // PE
        "82", // AL
        "83", // PB
        "84", // RN
        "85",
        "88", // CE
        "86",
        "89", // PI
        "91",
        "93",
        "94", // PA
        "92",
        "97", // AM
        "95", // RR
        "96", // AP
        "98",
        "99", // MA
      ]

      if (!validDDDs.includes(ddd)) {
        return { isValid: false, isComplete: false, message: "DDD inválido" }
      }

      // Verificar se é celular (deve começar com 9)
      if (ninthDigit !== "9") {
        return { isValid: false, isComplete: false, message: "Celular deve começar com 9" }
      }

      return { isValid: true, isComplete: true, message: "Telefone válido ✓" }
    }

    if (numbers.length > 11) {
      return { isValid: false, isComplete: false, message: "Telefone muito longo" }
    }

    return { isValid: false, isComplete: false, message: "Formato inválido" }
  }

  // Detectar e validar tipo de input
  const detectAndValidateInput = (value: string) => {
    if (value === "") {
      return {
        type: "unknown" as const,
        isValid: false,
        isComplete: false,
        message: "",
      }
    }

    // Se contém @, é email
    if (value.includes("@")) {
      const emailValidation = validateEmail(value)
      return {
        type: "email" as const,
        ...emailValidation,
      }
    }

    // Verificar se é telefone - melhorar a regex
    const cleanValue = value.replace(/\D/g, "")
    const hasPhonePattern = /^[\d\s().-]+$/.test(value) && cleanValue.length > 0

    if (hasPhonePattern || /^$$\d{2}$$/.test(value)) {
      const phoneValidation = validatePhone(value)
      return {
        type: "phone" as const,
        ...phoneValidation,
      }
    }

    // Se não se encaixa em nenhum padrão
    return {
      type: "unknown" as const,
      isValid: false,
      isComplete: false,
      message: "Digite um email ou telefone válido",
    }
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      if (numbers.length <= 2) {
        return numbers
      } else if (numbers.length <= 7) {
        return numbers.replace(/(\d{2})(\d+)/, "($1) $2")
      } else {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
      }
    }
    return value
  }

  const handleEmailOrPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    // Detectar tipo primeiro
    const tempValidation = detectAndValidateInput(value)

    // Auto-formatar telefone se detectado
    if (tempValidation.type === "phone") {
      value = formatPhoneNumber(value)
    }

    setEmailOrPhone(value)

    // Validar novamente após formatação
    const finalValidation = detectAndValidateInput(value)
    setValidation(finalValidation)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailOrPhone || !password) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Preencha todos os campos.",
      })
      return
    }

    if (!validation.isValid) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: validation.message || "Email ou telefone inválido.",
      })
      return
    }

    try {
      const isPhone = validation.type === "phone"

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [isPhone ? "cel" : "email"]: emailOrPhone,
          password,
        }),
      })

      if (response.ok) {
        const data: {
          token: string
          tutorialGuide: boolean
          executeQuery: boolean
          userId: string
        } = await response.json()

        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("tutorial-guide", data.tutorialGuide.toString())
        localStorage.setItem("execute-query", data.executeQuery.toString())
        localStorage.setItem("user-id", data.userId.toString())

        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Login realizado com sucesso.",
          confirmButtonText: "Entrar",
          timer: 1500,
        }).then(() => {
          router.push("/")
        })
      } else {
        const errorData = await response.json()
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: errorData.message || "Credenciais inválidas.",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
      })
    }
  }

  const routerRegister = () => {
    router.push("/auth/register")
  }

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password")
  }

  const getPlaceholder = () => {
    switch (validation.type) {
      case "email":
        return "usuario@exemplo.com"
      case "phone":
        return "(11) 99999-9999"
      default:
        return "email@exemplo.com ou (11) 99999-9999"
    }
  }

  const getInputIcon = () => {
    switch (validation.type) {
      case "email":
        return <Mail className={`w-5 h-5 ${validation.isValid ? "text-green-500" : "text-blue-500"}`} />
      case "phone":
        return <Phone className={`w-5 h-5 ${validation.isValid ? "text-green-500" : "text-orange-500"}`} />
      default:
        return <Mail className="w-5 h-5 text-gray-400" />
    }
  }

  const getValidationIcon = () => {
    if (validation.type === "unknown" || !emailOrPhone) return null

    if (validation.isValid) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getValidationColor = () => {
    if (validation.type === "unknown" || !emailOrPhone) return "border-slate-600"

    if (validation.isValid) {
      return "border-green-500 focus:border-green-600"
    } else {
      return "border-red-500 focus:border-red-600"
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader className="flex items-center justify-center">
            <Title />
            <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
            <p className="text-center text-gray-600 mt-2">Entre com seu email ou telefone</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 text-xl">
              {/* Campo Email ou Telefone */}
              <div className="space-y-2">
                <Label className="text-xl" htmlFor="emailOrPhone">
                  Email ou Telefone
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{getInputIcon()}</div>
                  <Input
                      id="emailOrPhone"
                      type="text"
                      value={emailOrPhone}
                      onChange={handleEmailOrPhoneChange}
                      className={`border-2 ${getValidationColor()} pl-12 pr-10`}
                      placeholder={getPlaceholder()}
                      required
                  />
                  {getValidationIcon() && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">{getValidationIcon()}</div>
                  )}
                </div>

                {/* Indicador visual do tipo detectado */}
                {validation.type !== "unknown" && emailOrPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      {validation.type === "email" && (
                          <>
                            <Mail className={`w-4 h-4 ${validation.isValid ? "text-green-500" : "text-blue-500"}`} />
                            <span className={validation.isValid ? "text-green-600" : "text-blue-600"}>
                        {validation.message}
                      </span>
                          </>
                      )}
                      {validation.type === "phone" && (
                          <>
                            <Phone className={`w-4 h-4 ${validation.isValid ? "text-green-500" : "text-orange-500"}`} />
                            <span className={validation.isValid ? "text-green-600" : "text-orange-600"}>
                        {validation.message}
                      </span>
                          </>
                      )}
                    </div>
                )}
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label className="text-xl" htmlFor="password">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-2 border-slate-600 pr-12"
                      placeholder="***********"
                      required
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Botão de Login */}
              <Button type="submit" className="w-full text-xl bg-blue-600 hover:bg-blue-700 text-white">
                Entrar
              </Button>

              {/* Link Esqueceu Senha */}
              <h3
                  onClick={handleForgotPassword}
                  className="cursor-pointer text-md text-blue-600 text-center underline hover:text-blue-800 transition-colors"
              >
                Esqueceu a senha?
              </h3>

              {/* Divisor */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-100 px-2 text-gray-500">ou</span>
                </div>
              </div>

              {/* Cadastro */}
              <div className="text-center space-y-3">
                <h2 className="text-xl text-black">Não possui uma conta?</h2>
                <Button
                    onClick={routerRegister}
                    className="w-full text-xl bg-green-600 hover:bg-green-700 text-white"
                    type="button"
                >
                  Cadastrar-se
                </Button>
              </div>
            </form>

            {/* Informações sobre tipos de login */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Exemplos válidos:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • <strong>Email</strong>: usuario@gmail.com
                </li>
                <li>
                  • <strong>Telefone</strong>: (11) 99999-9999
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
