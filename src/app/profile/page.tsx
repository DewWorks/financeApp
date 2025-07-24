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
    const currentProfileId = localStorage.getItem("current-profile-id")
    const isInCollaborativeProfile = currentProfileId && currentProfileId !== "null"

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
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Erro ao carregar perfil."
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
            const response = await axios.put(`/api/users`, {
                name: editName.trim(),
                email: editEmail.trim(),
                cel: editPhone.trim() ? [editPhone.trim()] : [],
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
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Erro ao atualizar perfil."
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
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Erro ao alterar senha."
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        }
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
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando perfil...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <User className="w-8 h-8 text-blue-500" />
                                <div>
                                    <CardTitle className="text-2xl font-bold">Meu Perfil</CardTitle>
                                    <p className="text-gray-600">Gerencie suas informações pessoais</p>
                                </div>
                            </div>
                            <Button onClick={goBack} variant="outline" className="flex items-center gap-2 bg-transparent">
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {isInCollaborativeProfile && (
                        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={goToCollaborative}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Users className="w-6 h-6 text-blue-500" />
                                    <div>
                                        <h3 className="font-medium">Gerenciar Conta Colaborativa</h3>
                                        <p className="text-sm text-gray-600">Membros, permissões e configurações</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
                                    className="flex items-center gap-2 hover:bg-yellow-600 hover:text-white"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                </Button>
                            )}
                        </div>
                        <Card
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setIsChangingPassword(true)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-6 h-6 text-green-500" />
                                    <div>
                                        <h3 className="font-medium">Alterar Senha</h3>
                                        <p className="text-sm text-gray-600">Mantenha sua conta segura</p>
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
                                    <Label className="flex items-center gap-2 text-gray-700">
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
                                        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                                            <p className="text-gray-800">{user.name}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-gray-700">
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
                                        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                                            <p className="text-gray-800">{user.email}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Telefone */}
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2 text-gray-700">
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
                                        <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                                            {user.cel && user.cel.length > 0 ? (
                                                <p className="text-gray-800">{user.cel[0].replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}</p>
                                            ) : (
                                                <p className="text-gray-500">Não informado</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Account Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium">Membro desde:</span>
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
                                        <span className="font-medium">Atualizado em:</span>
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
                                            className="flex items-center gap-2"
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md bg-white">
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
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
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
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
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
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
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
                                                className={`h-1 flex-1 rounded ${newPassword.length >= 6 ? "bg-green-500" : "bg-gray-300"}`}
                                            />
                                            <div
                                                className={`h-1 flex-1 rounded ${newPassword.length >= 8 && /[A-Z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}
                                            />
                                            <div
                                                className={`h-1 flex-1 rounded ${newPassword.length >= 8 && /[0-9]/.test(newPassword) && /[A-Z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
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
            </div>
        </div>
    )
}
