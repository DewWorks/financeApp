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
import axios from "axios"

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [inputType, setInputType] = useState<"email" | "phone" | "unknown">("unknown")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()

  // MFA States
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState("")
  const [userId, setUserId] = useState("")
  const [sendingCode, setSendingCode] = useState(false)

  const handleSendOtp = async (channel: 'email' | 'whatsapp') => {
    setSendingCode(true)
    try {
      const res = await fetch("/api/auth/mfa/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, channel })
      })
      if (res.ok) {
        Swal.fire("Sucesso", `Código enviado por ${channel === 'email' ? 'Email' : 'WhatsApp'}!`, "success")
      } else {
        Swal.fire("Erro", "Falha ao enviar código. Tente novamente.", "error")
      }
    } catch (error: any) {
      console.error("OTP Error:", error);
      Swal.fire("Erro de Conexão", "Não foi possível conectar ao servidor.", "error")
    } finally {
      setSendingCode(false)
    }
  }

  useEffect(() => {
    const cookies = document.cookie
    const token = cookies.includes("auth_token=")
    if (token) {
      router.push("/")
    }
  }, [])

  const handleEmailOrPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmailOrPhone(value)
    setErrorMessage("")

    if (value.includes("@")) {
      setInputType("email")
    } else if (/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(value) || /^\d+$/.test(value) || value.startsWith('+')) {
      setInputType("phone")
    } else if (value === "") {
      setInputType("unknown")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!mfaRequired && (!emailOrPhone || !password)) {
      Swal.fire({ icon: "error", title: "Erro!", text: "Preencha todos os campos." })
      return;
    }

    if (mfaRequired && mfaCode.length < 6) {
      Swal.fire({ icon: "error", title: "Erro!", text: "Digite o código de 6 dígitos." })
      return;
    }

    if (!mfaRequired && !emailOrPhone.includes("@") && (/\d/.test(emailOrPhone) || emailOrPhone.startsWith('+'))) {
      const validation = validatePhoneDetails(emailOrPhone);
      if (!validation.isValid) {
        Swal.fire({ icon: "info", title: "Atenção", text: "Número inválido." });
        return;
      }
    }

    setIsLoading(true)

    try {
      const isPhone = !emailOrPhone.includes("@") && /\d/.test(emailOrPhone);

      const payload: any = {
        [isPhone ? "cel" : "email"]: emailOrPhone,
        password,
      }

      if (mfaRequired) {
        payload.mfaCode = mfaCode
      }

      const response = await axios.post("/api/auth/login", payload)

      if (response.data.mfaRequired) {
        setMfaRequired(true);
        if (response.data.userId) setUserId(response.data.userId)
        setIsLoading(false);
        return;
      }

      localStorage.setItem("auth_token", response.data.token)
      localStorage.setItem("tutorial-guide", response.data.tutorialGuide.toString())
      localStorage.setItem("execute-query", response.data.executeQuery.toString())
      localStorage.setItem("user-id", response.data.userId.toString())

      try {
        const userRes = await axios.get("/api/users");
        if (userRes) {
          localStorage.setItem("user_data", JSON.stringify(userRes.data));
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

    } catch (error: any) {
      console.error("Login error:", error)

      let msg = "Ocorreu um erro inesperado.";

      // Robust Error Extraction
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data.error === 'string') msg = data.error;
        else if (typeof data.message === 'string') msg = data.message;
        else if (data.error && typeof data.error === 'object') msg = JSON.stringify(data.error); // Fallback for objects
      } else if (error.message) {
        msg = error.message;
      }

      setErrorMessage(msg);

      Swal.fire({
        icon: "error",
        title: "Ops!",
        text: msg,
        confirmButtonColor: "#d33",
        confirmButtonText: "Tentar novamente"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const routerRegister = () => router.push("/auth/register")
  const handleForgotPassword = () => router.push("/auth/forgot-password")
  const getPlaceholder = () => inputType === "email" ? "email@exemplo.com" : inputType === "phone" ? "(11) 99999-9999" : "email ou telefone";
  const getInputIcon = () => inputType === "email" ? <Mail className="w-5 h-5 text-blue-500" /> : inputType === "phone" ? <Phone className="w-5 h-5 text-green-500" /> : <Mail className="w-5 h-5 text-muted-foreground" />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <Card className="w-full max-w-md">
        <CardHeader className="flex items-center justify-center">
          <Title />
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <p className="text-center text-muted-foreground mt-2">
            {mfaRequired ? "Confirmação de Segurança" : "Entre com seu email ou telefone"}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xl">

            {!mfaRequired ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xl" htmlFor="emailOrPhone">Email ou Telefone</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{getInputIcon()}</div>
                    <Input id="emailOrPhone" type="text" value={emailOrPhone} onChange={handleEmailOrPhoneChange} className="border-2 border-border pl-12" placeholder={getPlaceholder()} required />
                  </div>
                  <p className={`text-xs ml-1 ${errorMessage ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                    {errorMessage || (inputType === 'phone' ? 'DDD + Número' : 'Email ou Celular')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xl" htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="border-2 border-border pr-12" placeholder="***********" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <p className="text-blue-800 dark:text-blue-300 font-medium mb-1">Conta Protegida</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Digite o código de 6 dígitos do seu app autenticador.</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xl text-center block">Código de Autenticação</Label>
                  <Input
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                    placeholder="000 000"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-2 justify-center pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sendingCode}
                    onClick={() => handleSendOtp('email')}
                    className="text-xs"
                  >
                    {sendingCode ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
                    Enviar por Email
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={sendingCode}
                    onClick={() => handleSendOtp('whatsapp')}
                    className="text-xs"
                  >
                    {sendingCode ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Phone className="w-3 h-3 mr-1" />}
                    WhatsApp
                  </Button>
                </div>

                <div className="text-center">
                  <Button variant="link" type="button" onClick={() => setMfaRequired(false)} className="text-muted-foreground">
                    Voltar para login
                  </Button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full text-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> {mfaRequired ? "Verificando..." : "Entrando..."}</> : (mfaRequired ? "Verificar" : "Entrar")}
            </Button>

            {!mfaRequired && (
              <>
                <h3 onClick={handleForgotPassword} className="cursor-pointer text-md text-blue-600 text-center underline hover:text-blue-800 transition-colors">Esqueceu a senha?</h3>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-sm"><span className="bg-background px-2 text-muted-foreground">ou</span></div>
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-xl text-foreground">Não possui uma conta?</h2>
                  <Button onClick={routerRegister} className="w-full text-xl bg-green-600 hover:bg-green-700 text-white" type="button">Cadastrar-se</Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
