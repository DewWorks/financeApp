"use client"

import type React from "react"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from "@/components/ui/molecules/Title"
import Swal from "sweetalert2"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle"

type Step = "email" | "code" | "password"

export default function ForgotPasswordPage() {
    const [currentStep, setCurrentStep] = useState<Step>("email")
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [token, setToken] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await axios.post("/api/auth/forgot-password", { email })

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Código enviado para seu e-mail.",
                    confirmButtonText: "Continuar",
                    timer: 3000,
                })
                setCurrentStep("code")
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao enviar código.";
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await axios.post("/api/auth/verify-code", { email, code })

            if (response.status === 200) {
                setToken(response.data.token)
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Código verificado com sucesso.",
                    confirmButtonText: "Continuar",
                    timer: 3000,
                })
                setCurrentStep("password")
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Código inválido ou expirado.";
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "As senhas não coincidem.",
            })
            return
        }

        if (newPassword.length < 6) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "A senha deve ter pelo menos 6 caracteres.",
            })
            return
        }

        setLoading(true)

        try {
            const response = await axios.post("/api/auth/reset-password", {
                token,
                newPassword,
            })

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Senha redefinida com sucesso.",
                    confirmButtonText: "Fazer Login",
                    timer: 3000,
                }).then(() => {
                    router.push("/auth/login")
                })
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao redefinir senha.";
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    const goBackToLogin = () => {
        router.push("/auth/login")
    }

    const renderEmailStep = () => (
        <form onSubmit={handleEmailSubmit} className="space-y-4 text-xl">
            <div className="space-y-2">
                <Label className="text-xl" htmlFor="email">
                    Email
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-2 border-border"
                    placeholder="email@example.com"
                    required
                />
            </div>
            <Button type="submit" className="w-full text-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? "Enviando..." : "Próximo"}
            </Button>
            <Button type="button" onClick={goBackToLogin} variant="outline" className="w-full text-xl">
                Voltar ao Login
            </Button>
        </form>
    )

    const renderCodeStep = () => (
        <form onSubmit={handleCodeSubmit} className="space-y-4 text-xl">
            <div className="text-center mb-4">
                <p className="text-muted-foreground">
                    Código enviado para: <strong>{email}</strong>
                </p>
            </div>
            <div className="space-y-2">
                <Label className="text-xl" htmlFor="code">
                    Código de Verificação
                </Label>
                <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="border-2 border-border"
                    placeholder="123456"
                    maxLength={6}
                    required
                />
            </div>
            <Button type="submit" className="w-full text-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? "Verificando..." : "Verificar Código"}
            </Button>
            <Button type="button" onClick={() => setCurrentStep("email")} variant="outline" className="w-full text-xl">
                Voltar
            </Button>
        </form>
    )

    const renderPasswordStep = () => (
        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xl">
            <div className="space-y-2">
                <Label className="text-xl" htmlFor="newPassword">
                    Nova Senha
                </Label>
                <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="border-2 border-border"
                    placeholder="***********"
                    minLength={6}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label className="text-xl" htmlFor="confirmPassword">
                    Confirmar Senha
                </Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-2 border-border"
                    placeholder="***********"
                    minLength={6}
                    required
                />
            </div>
            <Button type="submit" className="w-full text-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? "Redefinindo..." : "Concluir"}
            </Button>
            <Button type="button" onClick={() => setCurrentStep("code")} variant="outline" className="w-full text-xl">
                Voltar
            </Button>
        </form>
    )

    const getStepTitle = () => {
        switch (currentStep) {
            case "email":
                return "Recuperar Senha"
            case "code":
                return "Verificar Código"
            case "password":
                return "Nova Senha"
            default:
                return "Recuperar Senha"
        }
    }

    const getStepDescription = () => {
        switch (currentStep) {
            case "email":
                return "Digite seu e-mail para receber o código de verificação"
            case "code":
                return "Digite o código de 6 dígitos enviado para seu e-mail"
            case "password":
                return "Digite sua nova senha"
            default:
                return ""
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
                    <CardTitle className="text-2xl font-bold text-center">{getStepTitle()}</CardTitle>
                    <p className="text-center text-muted-foreground mt-2">{getStepDescription()}</p>
                </CardHeader>
                <CardContent>
                    {currentStep === "email" && renderEmailStep()}
                    {currentStep === "code" && renderCodeStep()}
                    {currentStep === "password" && renderPasswordStep()}
                </CardContent>
            </Card>
        </div>
    )
}
