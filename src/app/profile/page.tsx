"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { User, Mail, Phone, ArrowLeft, Edit, Save, X, Users, Shield, Eye, EyeOff } from "lucide-react"
import Swal from "sweetalert2"
import { IUser } from "@/interfaces/IUser"
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle"
import { MfaSetup } from "@/components/profile/MfaSetup"

export default function ProfilePage() {
    const [user, setUser] = useState<IUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    // Edit form states
    const [editName, setEditName] = useState("")
    const [editEmail, setEditEmail] = useState("")
    const [editPhone, setEditPhone] = useState("")

    // Password change states
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const router = useRouter()

    useEffect(() => {
        fetchUserProfile()
    }, [])

    const fetchUserProfile = async () => {
        try {
            const userId = localStorage.getItem("user-id")
            if (!userId) {
                Swal.fire({
                    icon: "error",
                    title: "Erro!",
                    text: "Usuário não encontrado. Faça login novamente.",
                }).then(() => {
                    router.push("/auth/login")
                })
                return
            }

            const response = await axios.get(`/api/users`)

            if (response.status === 200) {
                const userData = response.data
                setUser(userData)
                setEditName(userData.name)
                setEditEmail(userData.email)
                setEditPhone(userData.cel?.[0] || "")
            }
            // Verifica se o usuário tem conta colaborativa
            const profileRes = await axios.get(`/api/profiles`)
            if (profileRes.status === 200) {
                const profile = profileRes.data

                if (profile.collaborative) {
                    localStorage.setItem("current-profile-id", profile.profileId)
                    localStorage.setItem("profile-account", "true")
                    localStorage.setItem("current-profile-name", profile.profileName)
                } else {
                    localStorage.setItem("current-profile-id", userId)
                    localStorage.setItem("profile-account", "false")
                    localStorage.setItem("current-profile-name", response.data.name)
                }
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao carregar perfil.";
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveProfile = async () => {
        if (!editName.trim() || !editEmail.trim()) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "Nome e email são obrigatórios.",
            })
            return
        }

        try {
            // Normalizar telefone
            let formattedPhone = editPhone.trim()
            if (formattedPhone) {
                const justNumbers = formattedPhone.replace(/\D/g, "")
                if (justNumbers.length > 0) {
                    // Se não começar com 55 (e tiver tamanho de número local), adiciona
                    // Assumindo número local com 10 ou 11 dígitos (DDD + número)
                    if (!justNumbers.startsWith("55") && justNumbers.length <= 11) {
                        formattedPhone = `+55${justNumbers}`
                    } else if (justNumbers.startsWith("55")) {
                        formattedPhone = `+${justNumbers}`
                    } else {
                        formattedPhone = `+${justNumbers}`
                    }
                }
            }

            const response = await axios.put(`/api/users`, {
                name: editName.trim(),
                email: editEmail.trim(),
                cel: formattedPhone ? [formattedPhone] : [],
            })

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Perfil atualizado com sucesso!",
                    timer: 2000,
                })

                setIsEditing(false)
                fetchUserProfile()
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao atualizar perfil.";
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        }
    }

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "Todos os campos de senha são obrigatórios.",
            })
            return
        }

        if (newPassword !== confirmPassword) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "A nova senha e confirmação não coincidem.",
            })
            return
        }

        if (newPassword.length < 6) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "A nova senha deve ter pelo menos 6 caracteres.",
            })
            return
        }

        try {
            const response = await axios.put(`/api/users/password`, {
                currentPassword,
                newPassword,
            })

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Senha alterada com sucesso!",
                    timer: 2000,
                })

                setIsChangingPassword(false)
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao alterar senha.";
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        }
    }

    const formatPhoneNumber = (value: string) => {
        // Permitir digitação livre, mas tentar manter formatação visual se possível
        // Se começar com +, manter
        const hasPlus = value.startsWith("+")
        const numbers = value.replace(/\D/g, "")

        // Se o usuário estiver tentando digitar +55, deixa ele ir
        if (hasPlus) {
            return value
        }

        if (numbers.length <= 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
        }
        return value
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value
        // Se usuário apagar tudo, limpa
        if (!input) {
            setEditPhone("")
            return
        }

        // Se o último caractere for não-numérico e não for '+', espaço, parêntese ou traço, ignora (opcional, mas bom pra UX)
        // Aqui vamos ser permissivos como o usuário pediu "digitar livremente"
        // Mas a função formatPhoneNumber tenta aplicar máscara se parecer local
        const formatted = formatPhoneNumber(input)
        setEditPhone(formatted)
    }

    const goBack = () => {
        router.push("/")
    }

    const goToCollaborative = () => {
        router.push("/profile/collaborative")
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Carregando perfil...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background py-8">
            <div className="max-w-2xl mx-auto px-4 relative">
                {/* Theme Toggle Absolute */}
                <div className="absolute top-0 right-4 md:right-0 -mt-2">
                    <ThemeToggle />
                </div>

                {/* Header */}
                <Card className="mb-6 mt-8 md:mt-0">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <User className="w-8 h-8 text-blue-500" />
                                <div>
                                    <CardTitle className="text-2xl font-bold">Meu Perfil</CardTitle>
                                    <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
                                </div>
                            </div>
                            <Button onClick={goBack} variant="outline" className="flex items-center gap-2 bg-transparent hover:bg-accent">
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Quick Actions - COLLABORATIVE DISABLED
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow hover:bg-accent/50" onClick={goToCollaborative}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-blue-500" />
                                <div>
                                    <h3 className="font-medium text-foreground">Gerenciar Conta Colaborativa</h3>
                                    <p className="text-sm text-muted-foreground">Membros, permissões e configurações</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                */}

                {/* Security Section (MFA) */}
                <div className="mb-6">
                    {user && (
                        <MfaSetup
                            mfaEnabled={user.mfaEnabled || false}
                            onUpdate={fetchUserProfile}
                        />
                    )}
                </div>

                {/* Profile Information */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                            {!isEditing && (
                                <Button
                                    onClick={() => setIsEditing(true)}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 hover:bg-yellow-100 hover:text-yellow-700 dark:hover:bg-yellow-900/30 dark:hover:text-yellow-400"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                </Button>
                            )}
                        </div>
                        <Card
                            className="cursor-pointer hover:shadow-md transition-shadow hover:bg-accent/50 mt-4"
                            onClick={() => setIsChangingPassword(true)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-6 h-6 text-green-500" />
                                    <div>
                                        <h3 className="font-medium text-foreground">Alterar Senha</h3>
                                        <p className="text-sm text-muted-foreground">Mantenha sua conta segura</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="cursor-pointer hover:shadow-md transition-shadow hover:bg-accent/50 mt-4"
                            onClick={() => router.push('/profile/privacy')}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-6 h-6 text-purple-500" />
                                    <div>
                                        <h3 className="font-medium text-foreground">Minha Privacidade (LGPD)</h3>
                                        <p className="text-sm text-muted-foreground">Baixar dados ou excluir conta</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {user && (
                            <>
                                {/* Nome */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-foreground">
                                        <User className="w-4 h-4 text-blue-600" />
                                        Nome
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Seu nome completo"
                                        />
                                    ) : (
                                        <div className="bg-muted border border-border rounded-lg p-3">
                                            <p className="text-foreground">{user.name}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-foreground">
                                        <Mail className="w-4 h-4 text-blue-600" />
                                        Email
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                        />
                                    ) : (
                                        <div className="bg-muted border border-border rounded-lg p-3">
                                            <p className="text-foreground">{user.email}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Telefone */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-foreground">
                                        <Phone className="w-4 h-4 text-blue-600" />
                                        Telefone
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            type="tel"
                                            value={editPhone}
                                            onChange={handlePhoneChange}
                                            placeholder="(11) 99999-9999"
                                            maxLength={15}
                                        />
                                    ) : (
                                        <div className="bg-muted border border-border rounded-lg p-3">
                                            {user.cel && user.cel.length > 0 ? (
                                                <p className="text-foreground">{user.cel[0].replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}</p>
                                            ) : (
                                                <p className="text-muted-foreground">Não informado</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Account Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                    <div>
                                        <span className="font-medium text-foreground">Membro desde:</span>
                                        <p>
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString()
                                                : user.updatedAt
                                                    ? new Date(user.updatedAt).toLocaleDateString()
                                                    : "Data não disponível"}
                                        </p>
                                    </div>
                                    {user.updatedAt ? (
                                        <div>
                                            <span className="font-medium text-foreground">Atualizado em:</span>
                                            <p>

                                                {new Date(user.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ) : ''}
                                </div>

                                {/* Edit Actions */}
                                {isEditing && (
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button
                                            onClick={() => {
                                                setIsEditing(false)
                                                setEditName(user.name)
                                                setEditEmail(user.email)
                                                setEditPhone(user.cel?.[0] || "")
                                            }}
                                            variant="outline"
                                            className="flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleSaveProfile}
                                            className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Save className="w-4 h-4" />
                                            Salvar
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Change Password Modal */}
                {isChangingPassword && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md bg-white dark:bg-card">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-green-500" />
                                        Alterar Senha
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsChangingPassword(false)
                                            setCurrentPassword("")
                                            setNewPassword("")
                                            setConfirmPassword("")
                                        }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Current Password */}
                                <div className="space-y-2">
                                    <Label>Senha Atual</Label>
                                    <div className="relative">
                                        <Input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Digite sua senha atual"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div className="space-y-2">
                                    <Label>Nova Senha</Label>
                                    <div className="relative">
                                        <Input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Digite a nova senha"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="space-y-2">
                                    <Label>Confirmar Nova Senha</Label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirme a nova senha"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Password Strength Indicator */}
                                {newPassword && (
                                    <div className="space-y-1">
                                        <div className="flex gap-1">
                                            <div
                                                className={`h-1 flex-1 rounded ${newPassword.length >= 6 ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`}
                                            />
                                            <div
                                                className={`h-1 flex-1 rounded ${newPassword.length >= 8 && /[A-Z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`}
                                            />
                                            <div
                                                className={`h-1 flex-1 rounded ${newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[A-Z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"}`}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {newPassword.length < 6
                                                ? "Mínimo 6 caracteres"
                                                : newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[A-Z]/.test(newPassword)
                                                    ? "Senha forte"
                                                    : "Senha boa"}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                    <Button onClick={handleChangePassword} className="flex-1 text-white bg-blue-600 hover:bg-blue-700">
                                        Alterar Senha
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsChangingPassword(false)
                                            setCurrentPassword("")
                                            setNewPassword("")
                                            setConfirmPassword("")
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {/* Footer Links */}
                <div className="mt-8 pt-6 border-t border-border flex justify-center gap-6 text-xs text-muted-foreground">
                    <a href="mailto:devworks.company.io@gmail.com" className="hover:text-foreground transition-colors">
                        Contato
                    </a>
                    <a href="/terms" className="hover:text-foreground transition-colors">
                        Termos de Uso
                    </a>
                </div>
            </div>
        </div>
    )
}
