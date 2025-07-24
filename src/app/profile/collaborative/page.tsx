"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Users, Mail, Phone, ArrowLeft, Plus, Edit, Trash2, Shield, Eye, UserCheck, Crown } from "lucide-react"
import Swal from "sweetalert2"

interface ProfileMember {
    userId: string
    userName: string
    userEmail: string
    userPhone?: string
    permission: "ADMIN" | "COLABORATOR" | "VIEWER"
    joinedAt: string
    status: "ACTIVE" | "PENDING" | "SUSPENDED"
}

interface CollaborativeProfile {
    _id: string
    name: string
    description: string
    members: ProfileMember[]
    createdBy: string
    isUserAdmin: boolean
}

export default function CollaborativeProfilePage() {
    const [profile, setProfile] = useState<CollaborativeProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [showAddMember, setShowAddMember] = useState(false)
    const [editingMember, setEditingMember] = useState<ProfileMember | null>(null)

    // Form states
    const [newMemberEmail, setNewMemberEmail] = useState("")
    const [newMemberPhone, setNewMemberPhone] = useState("")
    const [newMemberPermission, setNewMemberPermission] = useState<"ADMIN" | "COLABORATOR" | "VIEWER">("COLABORATOR")
    const [formLoading, setFormLoading] = useState(false)

    const router = useRouter()

    useEffect(() => {
        fetchProfileData()
    }, [])

    const fetchProfileData = async () => {
        try {
            const currentProfileId = localStorage.getItem("current-profile-id")

            if (!currentProfileId || currentProfileId === "null") {
                Swal.fire({
                    icon: "warning",
                    title: "Aviso!",
                    text: "Você precisa estar em uma conta colaborativa para acessar esta página.",
                }).then(() => {
                    router.push("/profile")
                })
                return
            }

            const response = await axios.get(`/api/profiles/${currentProfileId}/details`)

            if (response.status === 200) {
                setProfile(response.data)
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Erro ao carregar perfil colaborativo."
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            }).then(() => {
                router.push("/profile")
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newMemberEmail.trim()) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "Email é obrigatório.",
            })
            return
        }

        setFormLoading(true)

        try {
            const response = await axios.post(`/api/profiles/${profile?._id}/members`, {
                email: newMemberEmail.trim(),
                phone: newMemberPhone.trim() || undefined,
                permission: newMemberPermission,
            })

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Membro adicionado com sucesso!",
                    timer: 2000,
                })

                // Reset form
                setNewMemberEmail("")
                setNewMemberPhone("")
                setNewMemberPermission("COLABORATOR")
                setShowAddMember(false)

                // Refresh data
                fetchProfileData()
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Erro ao adicionar membro."
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        } finally {
            setFormLoading(false)
        }
    }

    const handleUpdateMember = async (memberId: string, newPermission: string) => {
        try {
            const response = await axios.put(`/api/profiles/${profile?._id}/members/${memberId}`, {
                permission: newPermission,
            })

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Permissão atualizada com sucesso!",
                    timer: 2000,
                })

                fetchProfileData()
                setEditingMember(null)
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Erro ao atualizar membro."
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        }
    }

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        const result = await Swal.fire({
            title: "Tem certeza?",
            text: `Deseja remover ${memberName} do perfil colaborativo?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sim, remover",
            cancelButtonText: "Cancelar",
        })

        if (result.isConfirmed) {
            try {
                const response = await axios.delete(`/api/profiles/${profile?._id}/members/${memberId}`)

                if (response.status === 200) {
                    Swal.fire({
                        icon: "success",
                        title: "Removido!",
                        text: "Membro removido com sucesso.",
                        timer: 2000,
                    })

                    fetchProfileData()
                }
            } catch (error: any) {
                const errorMessage = error.response?.data?.error || "Erro ao remover membro."
                Swal.fire({
                    icon: "error",
                    title: "Erro!",
                    text: errorMessage,
                })
            }
        }
    }

    const getPermissionIcon = (permission: string) => {
        switch (permission) {
            case "ADMIN":
                return <Crown className="w-4 h-4 text-yellow-500" />
            case "COLABORATOR":
                return <UserCheck className="w-4 h-4 text-blue-500" />
            case "VIEWER":
                return <Eye className="w-4 h-4 text-gray-500" />
            default:
                return <Shield className="w-4 h-4 text-gray-400" />
        }
    }

    const getPermissionColor = (permission: string) => {
        switch (permission) {
            case "ADMIN":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "COLABORATOR":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "VIEWER":
                return "bg-gray-100 text-gray-800 border-gray-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
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
        setNewMemberPhone(formatted)
    }

    const goBack = () => {
        router.push("/profile")
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando perfil colaborativo...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-500" />
                                <div>
                                    <CardTitle className="text-2xl font-bold">{profile?.name}</CardTitle>
                                    <p className="text-gray-600 mt-1">{profile?.description}</p>
                                </div>
                            </div>
                            <Button onClick={goBack} variant="outline" className="flex items-center gap-2 bg-transparent">
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                {/* Add Member Section */}
                {profile?.isUserAdmin && (
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Gerenciar Membros</CardTitle>
                                <Button
                                    onClick={() => setShowAddMember(!showAddMember)}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Membro
                                </Button>
                            </div>
                        </CardHeader>

                        {showAddMember && (
                            <CardContent>
                                <form onSubmit={handleAddMember} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newMemberEmail}
                                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                                placeholder="usuario@exemplo.com"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone (Opcional)</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={newMemberPhone}
                                                onChange={handlePhoneChange}
                                                placeholder="(11) 99999-9999"
                                                maxLength={15}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="permission">Permissão</Label>
                                        <select
                                            id="permission"
                                            value={newMemberPermission}
                                            onChange={(e) => setNewMemberPermission(e.target.value as any)}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="VIEWER">Visualizador - Apenas visualizar</option>
                                            <option value="COLABORATOR">Colaborador - Adicionar e editar transações</option>
                                            <option value="ADMIN">Administrador - Controle total</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button type="submit" disabled={formLoading} className="bg-green-600 hover:bg-green-700">
                                            {formLoading ? "Adicionando..." : "Adicionar Membro"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowAddMember(false)
                                                setNewMemberEmail("")
                                                setNewMemberPhone("")
                                                setNewMemberPermission("COLABORATOR")
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        )}
                    </Card>
                )}

                {/* Members List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Membros ({profile?.members.length || 0})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {profile?.members.map((member) => (
                                <div
                                    key={member.userId}
                                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-blue-600" />
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-gray-900">{member.userName}</h4>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail className="w-3 h-3" />
                                                {member.userEmail}
                                            </div>
                                            {member.userPhone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone className="w-3 h-3" />
                                                    {member.userPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                Membro desde {new Date(member.joinedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {/* Permission Badge */}
                                        <div
                                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPermissionColor(member.permission)}`}
                                        >
                                            {getPermissionIcon(member.permission)}
                                            {member.permission}
                                        </div>

                                        {/* Actions */}
                                        {profile?.isUserAdmin && member.userId !== profile.createdBy && (
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline" onClick={() => setEditingMember(member)} className="p-1">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRemoveMember(member.userId, member.userName)}
                                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {(!profile?.members || profile.members.length === 0) && (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Nenhum membro encontrado</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Member Modal */}
                {editingMember && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Editar Permissão</CardTitle>
                                <p className="text-gray-600">{editingMember.userName}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nova Permissão</Label>
                                        <select
                                            value={editingMember.permission}
                                            onChange={(e) =>
                                                setEditingMember({
                                                    ...editingMember,
                                                    permission: e.target.value as any,
                                                })
                                            }
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="VIEWER">Visualizador - Apenas visualizar</option>
                                            <option value="COLABORATOR">Colaborador - Adicionar e editar transações</option>
                                            <option value="ADMIN">Administrador - Controle total</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleUpdateMember(editingMember.userId, editingMember.permission)}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Salvar
                                        </Button>
                                        <Button variant="outline" onClick={() => setEditingMember(null)}>
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
