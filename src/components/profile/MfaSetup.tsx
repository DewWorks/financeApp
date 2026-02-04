"use client"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/atoms/card"
import { Shield, CheckCircle, Smartphone, Loader2 } from "lucide-react"
import Swal from "sweetalert2"

interface MfaSetupProps {
    mfaEnabled: boolean
    onUpdate: () => void
}

export function MfaSetup({ mfaEnabled, onUpdate }: MfaSetupProps) {
    const [step, setStep] = useState<"idle" | "setup">("idle")
    const [secret, setSecret] = useState("")
    const [qrCode, setQrCode] = useState("")
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)

    const startSetup = async () => {
        setLoading(true)
        try {
            const response = await axios.post("/api/auth/mfa/setup")
            setSecret(response.data.secret)
            setQrCode(response.data.qrCode)
            setStep("setup")
        } catch (error) {
            Swal.fire("Erro", "Falha ao iniciar configuração MFA", "error")
        } finally {
            setLoading(false)
        }
    }

    const verifyAndActivate = async () => {
        if (code.length < 6) return
        setLoading(true)
        try {
            await axios.post("/api/auth/mfa/verify", {
                secret,
                code
            })

            Swal.fire("Sucesso", "Autenticação em dois fatores ativada!", "success")
            setStep("idle")
            onUpdate() // Refresh parent state
        } catch (error) {
            Swal.fire("Erro", "Código inválido. Tente novamente.", "error")
        } finally {
            setLoading(false)
        }
    }

    if (mfaEnabled) {
        return (
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
                <CardContent className="flex items-center gap-4 p-6">
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">MFA Ativado</h3>
                        <p className="text-sm text-green-700 dark:text-green-400">Sua conta está protegida com autenticação em duas etapas.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Segurança Extra
                </CardTitle>
                <CardDescription>
                    Proteja sua conta solicitando um código do seu celular ao fazer login.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {step === "idle" && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-10 h-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Autenticação em Duas Etapas</p>
                                <p className="text-sm text-muted-foreground">Recomendado para proteção financeira.</p>
                            </div>
                        </div>
                        <Button onClick={startSetup} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Ativar MFA"}
                        </Button>
                    </div>
                )}

                {step === "setup" && (
                    <div className="space-y-6">
                        <div className="text-center space-y-4">
                            <p className="text-sm text-muted-foreground">
                                1. Abra seu aplicativo autenticador (Google Authenticator, Authy).
                                <br />
                                2. Escaneie este QR Code.
                            </p>

                            {qrCode ? (
                                <img src={qrCode} alt="MFA QR Code" className="mx-auto border-4 border-white shadow-sm rounded-lg" />
                            ) : (
                                <div className="h-48 w-48 mx-auto bg-gray-200 animate-pulse rounded-lg" />
                            )}

                            <p className="text-xs text-muted-foreground break-all">
                                Segredo manual: <span className="font-mono bg-muted p-1 rounded">{secret}</span>
                            </p>
                        </div>

                        <div className="space-y-2 max-w-xs mx-auto">
                            <Label>Digite o código de 6 dígitos</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="text-center text-lg tracking-widest"
                                />
                                <Button onClick={verifyAndActivate} disabled={loading || code.length !== 6}>
                                    {loading ? <Loader2 className="animate-spin" /> : "Verificar"}
                                </Button>
                            </div>
                        </div>

                        <div className="text-center">
                            <Button variant="link" onClick={() => setStep("idle")} className="text-muted-foreground">
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
