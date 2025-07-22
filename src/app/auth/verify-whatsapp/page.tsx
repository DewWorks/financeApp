"use client"

import React from "react"

import type { ReactElement } from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from "@/components/ui/molecules/Title"
import { CheckCircle, Eye, EyeOff } from "lucide-react"
import Swal from "sweetalert2"

export default function VerifyAccountPage(): ReactElement {
    const [verificationCode, setVerificationCode] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [email, setEmail] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [cel, setCel] = useState("")
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validações
        if (!verificationCode || !password) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "Código de verificação e senha são obrigatórios.",
            })
            return
        }

        if (password !== confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "As senhas não coincidem.",
            })
            return
        }

        if (password.length < 6) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "A senha deve ter pelo menos 6 caracteres.",
            })
            return
        }

        if (verificationCode.length !== 6) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "O código de verificação deve ter 6 dígitos.",
            })
            return
        }

        if (!cel) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "Número de telefone é obrigatório.",
            })
            return
        }

        setLoading(true)

        try {
            const requestData = {
                verificationCode,
                password,
                email,
                cel
            }

            const response = await axios.post("/api/auth/verify-whatsapp", requestData)

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Conta verificada com sucesso! Você já pode fazer login.",
                    confirmButtonText: "Fazer Login",
                    timer: 4000,
                }).then(() => {
                    router.push("/auth/login")
                })
            }
        } catch (error: unknown) {
            let errorMessage = "Erro ao verificar conta."

            if ((error as AxiosError)?.response?.status === 404) {
                errorMessage = "Código de verificação não encontrado."
            } else if ((error as AxiosError)?.response?.status === 401) {
                errorMessage = "Código de verificação inválido."
            } else if ((error as AxiosError)?.response?.status === 410) {
                errorMessage = "Código de verificação expirado. Solicite um novo código."
            }

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

    const formatVerificationCode = (value: string) => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, "")
        // Limita a 6 dígitos
        return numbers.slice(0, 6)
    }

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatVerificationCode(e.target.value)
        setVerificationCode(formatted)
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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader className="flex items-center justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <Title />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Verificar Conta</CardTitle>
                    <p className="text-center text-gray-600 mt-2">Digite o código de verificação e defina sua senha</p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4 text-xl">
                        {/* Código de Verificação */}
                        <div className="space-y-2">
                            <Label className="text-xl" htmlFor="verificationCode">
                                Código de Verificação
                            </Label>
                            <Input
                                id="verificationCode"
                                type="text"
                                value={verificationCode}
                                onChange={handleCodeChange}
                                className="border-2 border-slate-600 text-center text-2xl font-mono tracking-widest"
                                placeholder="123456"
                                maxLength={6}
                                required
                            />
                            <p className="text-sm text-gray-500">Digite o código de 6 dígitos que você recebeu</p>
                        </div>

                        {/* Número de Telefone */}
                        <div className="space-y-2">
                            <Label className="text-xl" htmlFor="cel">
                                Número de Telefone
                            </Label>
                            <Input
                                id="cel"
                                type="tel"
                                value={cel}
                                onChange={handlePhoneChange}
                                className="border-2 border-slate-600"
                                placeholder="(11) 99999-9999"
                                maxLength={15}
                                required
                            />
                            <p className="text-sm text-gray-500">Digite o número que recebeu o código</p>
                        </div>
                        
                        {/* Email */}
                        <div className="space-y-2">
                            <Label className="text-xl" htmlFor="email">
                                Email
                            </Label>
                            <Input
                                required
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border-2 border-slate-600"
                                placeholder="seu@email.com"
                            />
                         </div>

                        {/* Nova Senha */}
                        <div className="space-y-2">
                            <Label className="text-xl" htmlFor="password">
                                Nova Senha
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="border-2 border-slate-600 pr-12"
                                    placeholder="***********"
                                    minLength={6}
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

                        {/* Confirmar Senha */}
                        <div className="space-y-2">
                            <Label className="text-xl" htmlFor="confirmPassword">
                                Confirmar Senha
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="border-2 border-slate-600 pr-12"
                                    placeholder="***********"
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Indicador de força da senha */}
                        {password && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    <div className={`h-1 flex-1 rounded ${password.length >= 6 ? "bg-green-500" : "bg-gray-300"}`} />
                                    <div
                                        className={`h-1 flex-1 rounded ${
                                            password.length >= 8 && /[A-Z]/.test(password) ? "bg-green-500" : "bg-gray-300"
                                        }`}
                                    />
                                    <div
                                        className={`h-1 flex-1 rounded ${
                                            password.length >= 8 && /[0-9]/.test(password) && /[A-Z]/.test(password)
                                                ? "bg-green-500"
                                                : "bg-gray-300"
                                        }`}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    {password.length < 6
                                        ? "Mínimo 6 caracteres"
                                        : password.length >= 8 && /[0-9]/.test(password) && /[A-Z]/.test(password)
                                            ? "Senha forte"
                                            : "Senha boa"}
                                </p>
                            </div>
                        )}

                        {/* Botões */}
                        <div className="space-y-3 pt-4">
                            <Button
                                type="submit"
                                className="w-full text-xl bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={loading}
                            >
                                {loading ? "Verificando..." : "Enviar"}
                            </Button>

                            <Button
                                type="button"
                                onClick={goBackToLogin}
                                className="w-full text-xl bg-gray-600 hover:bg-gray-700 text-white"
                            >
                                Voltar ao Login
                            </Button>
                        </div>
                    </form>

                    {/* Informações adicionais */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Informações:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Digite o código que ganhou por Whatsapp</li>
                            <li>• O código de verificação tem 6 dígitos</li>
                            <li>• Códigos expiram após um tempo determinado</li>
                            <li>• A senha deve ter pelo menos 6 caracteres</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
