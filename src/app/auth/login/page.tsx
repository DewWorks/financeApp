"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from "@/components/ui/molecules/Title"
import { Mail, Phone, Eye, EyeOff, Loader2 } from "lucide-react"
import Swal from "sweetalert2"
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle"
import { validatePhoneDetails } from "@/lib/phoneUtils"

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [inputType, setInputType] = useState<"email" | "phone" | "unknown">("unknown")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    const cookies = document.cookie
    const token = cookies.includes("auth_token=")
    if (token) {
      router.push("/")
    }
  }, [])

  // Detectar se é email ou telefone conforme o usuário digita
  const handleEmailOrPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmailOrPhone(value)
    setErrorMessage("") // Limpa erro ao digitar

    // Detectar tipo de input
    if (value.includes("@")) {
      setInputType("email")
    } else if (/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(value) || /^\d+$/.test(value) || value.startsWith('+')) {
      setInputType("phone")
      // Auto-formatar telefone apenas se estiver "limpo" (não complexo com DDI +55 explicitado pelo usuário)
      // Se usuario digitar +55, deixamos ele controlar ou aplicamos mascara depois.
      // Por enquanto, validação visual.
    } else if (value === "") {
      setInputType("unknown")
    }
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }
    return value
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailOrPhone || !password) {
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Preencha todos os campos.",
      })
      return;
    }

    // Validação específica de telefone antes do envio
    // Se não tem @ e tem números (ou +), assumimos que é telefone
    if (!emailOrPhone.includes("@") && (/\d/.test(emailOrPhone) || emailOrPhone.startsWith('+'))) {
      const validation = validatePhoneDetails(emailOrPhone);
      if (!validation.isValid) {
        let errorMsg = "Número inválido.";
        let warningText = "";

        switch (validation.error) {
          case 'TOO_SHORT':
            errorMsg = "O número digitado é muito curto.";
            warningText = "Verifique o DDD e o 9º dígito.";
            break;
          case 'TOO_LONG':
            errorMsg = "O número digitado é muito longo.";
            break;
          case 'INVALID_COUNTRY':
            errorMsg = "Código de país inválido.";
            break;
          case 'NOT_A_NUMBER':
            errorMsg = "Caracteres inválidos.";
            break;
          default:
            errorMsg = "Verifique o número digitado.";
            warningText = "Formato esperado: (DDD) 99999-9999";
        }

        const fullMsg = warningText ? `${errorMsg}\n${warningText}` : errorMsg;

        setErrorMessage(fullMsg.replace(/\n/g, ' ')); // Mostra no parágrafo

        Swal.fire({
          icon: "info",
          title: "Atenção",
          text: fullMsg.replace(/\n/g, ' '),
          confirmButtonColor: "#0085FF"
        });
        return;
      }
    }

    setIsLoading(true)

    try {
      // Detectar se é telefone ou email
      // Detectar se é telefone ou email logicamente
      // Se tiver @ é email. Se não tiver @ e tiver digitos, é telefone.
      const isPhone = !emailOrPhone.includes("@") && /\d/.test(emailOrPhone);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [isPhone ? "cel" : "email"]: emailOrPhone,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem("auth_token", data.token)
        localStorage.setItem("tutorial-guide", data.tutorialGuide.toString())
        localStorage.setItem("execute-query", data.executeQuery.toString())
        localStorage.setItem("user-id", data.userId.toString())

        // PREFETCH: Fetch full user profile immediately to populate localStorage
        // This ensures the Dashboard has data even if the initial network call fails
        try {
          const userRes = await fetch("/api/users");
          if (userRes.ok) {
            const userData = await userRes.json();
            localStorage.setItem("user_data", JSON.stringify(userData));
          }
        } catch (e) {
          console.error("Prefetch failed", e);
        }

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
        console.error("Login API Error:", data)
        const msg = data.error || data.message || "Erro ao processar login.";
        setErrorMessage(msg);
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: msg,
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      Swal.fire({
        icon: "error",
        title: "Erro!",
        text: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const routerRegister = () => {
    router.push("/auth/register")
  }

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password")
  }

  const getPlaceholder = () => {
    switch (inputType) {
      case "email":
        return "email@exemplo.com"
      case "phone":
        return "(11) 99999-9999"
      default:
        return "email@exemplo.com ou (11) 99999-9999"
    }
  }

  const getInputIcon = () => {
    switch (inputType) {
      case "email":
        return <Mail className="w-5 h-5 text-blue-500" />
      case "phone":
        return <Phone className="w-5 h-5 text-green-500" />
      default:
        return <Mail className="w-5 h-5 text-muted-foreground" />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center justify-center">
          <Title />
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <p className="text-center text-muted-foreground mt-2">Entre com seu email ou telefone</p>
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
                  className="border-2 border-border pl-12"
                  placeholder={getPlaceholder()}
                  required
                />
              </div>
              {/* Helper Text para Telefone ou Erro */}
              <p className={`text-xs ml-1 ${errorMessage ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                {errorMessage
                  ? errorMessage
                  : inputType === 'phone'
                    ? 'Digite DDD + Número (Ex: 63 99999-9999)'
                    : inputType === 'email'
                      ? 'Digite seu e-mail cadastrado'
                      : 'Digite seu e-mail ou celular com DDD'}
              </p>

              {/* Indicador visual do tipo detectado */}
              {inputType !== "unknown" && (
                <div className="flex items-center gap-2 text-sm">
                  {inputType === "email" && (
                    <>
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-600">Email detectado</span>
                    </>
                  )}
                  {inputType === "phone" && (
                    <>
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Telefone detectado</span>
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
                  className="border-2 border-border pr-12"
                  placeholder="***********"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full text-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
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
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Cadastro */}
            <div className="text-center space-y-3">
              <h2 className="text-xl text-foreground">Não possui uma conta?</h2>
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
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-400 mb-2">💡 Dica:</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>
                • Use seu <strong>email</strong>: usuario@email.com
              </li>
              <li>
                • Ou seu <strong>telefone</strong>: (11) 99999-9999
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
