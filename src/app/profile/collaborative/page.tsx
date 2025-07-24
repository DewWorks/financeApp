"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import {
    Users,
    Mail,
    Phone,
    ArrowLeft,
    Edit,
    Trash2,
    Shield,
    Eye,
    UserCheck,
    Crown,
    DollarSign,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Settings,
    UserPlus,
    Activity,
} from "lucide-react"
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
    createdAt: string
    isUserAdmin: boolean
}

interface ProfileStats {
    monthly: {
        income: number
        expense: number
        balance: number
        transactionCount: number
    }
    total: {
        income: number
        expense: number
        balance: number
        transactionCount: number
    }
    recentTransactions: any[]
    topCategories: any[]
}

export default function CollaborativeDetailsPage() {
    const [profile, setProfile] = useState<CollaborativeProfile | null>(null)
    const [stats, setStats] = useState<ProfileStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [showAddMember, setShowAddMember] = useState(false)
    const [editingMember, setEditingMember] = useState<ProfileMember | null>(null)
    const [showSettings, setShowSettings] = useState(false)

    // Form states
    const [newMemberEmail, setNewMemberEmail] = useState("")
    const [newMemberPhone, setNewMemberPhone] = useState("")
    const [newMemberPermission, setNewMemberPermission] = useState<"ADMIN" | "COLABORATOR" | "VIEWER">("COLABORATOR")
    const [formLoading, setFormLoading] = useState(false)

    // Settings states
    const [editName, setEditName] = useState("")
    const [editDescription, setEditDescription] = useState("")

    const router = useRouter()

    useEffect(() => {
        fetchProfileData()
        fetchProfileStats()
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
                const profileData = response.data
                setProfile(profileData)
                setEditName(profileData.name)
                setEditDescription(profileData.description || "")
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

    const fetchProfileStats = async () => {
        try {
            const currentProfileId = localStorage.getItem("current-profile-id")
            if (!currentProfileId || currentProfileId === "null") return

            const response = await axios.get(`/api/profiles/${currentProfileId}/stats`)
            if (response.status === 200) {
                setStats(response.data)
            }
        } catch (error) {
            console.error("Error fetching stats:", error)
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
                const { memberAdded } = response.data

                Swal.fire({
                    icon: "success",
                    title: "Membro Adicionado!",
                    html: `
          <div style="text-align: left;">
            <p><strong>✅ ${memberAdded.name}</strong> foi adicionado com sucesso!</p>
            <p><strong>📧 Email:</strong> ${memberAdded.email}</p>
            <p><strong>🔐 Permissão:</strong> ${memberAdded.permission}</p>
            <hr style="margin: 15px 0;">
            <p style="color: #666; font-size: 14px;">
              📬 Um email de boas-vindas foi enviado com todas as informações necessárias.
            </p>
          </div>
        `,
                    confirmButtonText: "Entendi",
                    timer: 5000,
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
            console.log("Updating member:", memberId, "to permission:", newPermission)

            const response = await axios.put(`/api/profiles/${profile?._id}/members/${memberId}`, {
                permission: newPermission,
            })

            if (response.status === 200) {
                const { updatedMember } = response.data

                Swal.fire({
                    icon: "success",
                    title: "Permissão Atualizada!",
                    html: `
          <div style="text-align: left;">
            <p><strong>✅ ${updatedMember.name}</strong></p>
            <p><strong>📧 Email:</strong> ${updatedMember.email}</p>
            <p><strong>🔄 Alteração:</strong> ${updatedMember.oldPermission} → ${updatedMember.newPermission}</p>
            <hr style="margin: 15px 0;">
            <p style="color: #666; font-size: 14px;">
              📬 Um email de notificação foi enviado sobre a mudança de permissão.
            </p>
          </div>
        `,
                    confirmButtonText: "Entendi",
                    timer: 4000,
                })

                fetchProfileData()
                setEditingMember(null)
            }
        } catch (error: any) {
            console.error("Update member error:", error)
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
            html: `
        <div style="text-align: left;">
          <p>Deseja remover <strong>${memberName}</strong> do perfil colaborativo?</p>
          <hr style="margin: 15px 0;">
          <p style="color: #666; font-size: 14px;">
            ⚠️ Esta ação não pode ser desfeita.<br>
            📬 Um email de notificação será enviado ao membro removido.
          </p>
        </div>
      `,
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
                    const { removedMember } = response.data

                    Swal.fire({
                        icon: "success",
                        title: "Membro Removido!",
                        html: `
            <div style="text-align: left;">
              <p><strong>✅ ${removedMember.name}</strong> foi removido com sucesso!</p>
              <p><strong>📧 Email:</strong> ${removedMember.email}</p>
              <p><strong>🔐 Permissão anterior:</strong> ${removedMember.permission}</p>
              <hr style="margin: 15px 0;">
              <p style="color: #666; font-size: 14px;">
                📬 Um email de notificação foi enviado sobre a remoção.
              </p>
            </div>
          `,
                        confirmButtonText: "Entendi",
                        timer: 4000,
                    })

                    fetchProfileData()
                }
            } catch (error: any) {
                console.error("Remove member error:", error)
                const errorMessage = error.response?.data?.error || "Erro ao remover membro."
                Swal.fire({
                    icon: "error",
                    title: "Erro!",
                    text: errorMessage,
                })
            }
        }
    }

    const handleUpdateProfile = async () => {
        if (!editName.trim()) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "Nome da conta é obrigatório.",
            })
            return
        }

        try {
            const response = await axios.put(`/api/profiles/${profile?._id}`, {
                name: editName.trim(),
                description: editDescription.trim(),
            })

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Conta atualizada com sucesso!",
                    timer: 2000,
                })

                setShowSettings(false)
                fetchProfileData()

                // Atualizar localStorage se necessário
                localStorage.setItem("current-profile-name", editName.trim())
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Erro ao atualizar conta."
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    const goBack = () => {
        router.push("/")
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando detalhes da conta...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-blue-500" />
                                <div>
                                    <CardTitle className="text-2xl font-bold">{profile?.name}</CardTitle>
                                    <p className="text-gray-600 mt-1">{profile?.description}</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Criada em {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {profile?.isUserAdmin && (
                                    <Button onClick={() => setShowSettings(true)} variant="outline" className="flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        Configurações
                                    </Button>
                                )}
                                <Button onClick={goBack} variant="outline" className="flex items-center gap-2 bg-transparent">
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Receitas (Mês)</p>
                                        <p className="text-lg font-semibold text-green-600">{formatCurrency(stats.monthly.income)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Despesas (Mês)</p>
                                        <p className="text-lg font-semibold text-red-600">{formatCurrency(stats.monthly.expense)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <DollarSign className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Saldo (Mês)</p>
                                        <p
                                            className={`text-lg font-semibold ${stats.monthly.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                                        >
                                            {formatCurrency(stats.monthly.balance)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Activity className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Transações</p>
                                        <p className="text-lg font-semibold text-purple-600">{stats.monthly.transactionCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Members Management */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Membros ({profile?.members.length || 0})
                                    </CardTitle>
                                    {profile?.isUserAdmin && (
                                        <Button
                                            onClick={() => setShowAddMember(!showAddMember)}
                                            className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700"
                                            size="sm"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            Adicionar
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent>
                                {/* Add Member Form */}
                                {showAddMember && profile?.isUserAdmin && (
                                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                        <h4 className="font-medium mb-4">Adicionar Novo Membro</h4>
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
                                                <Button
                                                    type="submit"
                                                    disabled={formLoading}
                                                    className="bg-green-600 hover:bg-green-700"
                                                    size="sm"
                                                >
                                                    {formLoading ? "Adicionando..." : "Adicionar"}
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
                                                    size="sm"
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Members List */}
                                <div className="space-y-3">
                                    {profile?.members.map((member) => (
                                        <div
                                            key={member.userId}
                                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Users className="w-4 h-4 text-blue-600" />
                                                </div>

                                                <div>
                                                    <h4 className="font-medium text-gray-900 text-sm">{member.userName}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <Mail className="w-3 h-3" />
                                                        {member.userEmail}
                                                    </div>
                                                    {member.userPhone && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <Phone className="w-3 h-3" />
                                                            {member.userPhone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
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
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setEditingMember(member)}
                                                            className="p-1"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRemoveMember(member.userId, member.userName)}
                                                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
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
                    </div>

                    {/* Sidebar with additional info */}
                    <div className="space-y-6">
                        {/* Recent Transactions */}
                        {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        Transações Recentes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats.recentTransactions.slice(0, 5).map((transaction, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <div>
                                                    <p className="font-medium">{transaction.description}</p>
                                                    <p className="text-gray-500 text-xs">{new Date(transaction.date).toLocaleDateString()}</p>
                                                </div>
                                                <span
                                                    className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                                                >
                          {transaction.type === "income" ? "+" : "-"}
                                                    {formatCurrency(transaction.amount)}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Categories */}
                        {stats?.topCategories && stats.topCategories.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5" />
                                        Top Categorias
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats.topCategories.map((category, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <div>
                                                    <p className="font-medium">{category._id}</p>
                                                    <p className="text-gray-500 text-xs">{category.count} transações</p>
                                                </div>
                                                <span className="font-medium text-red-600">{formatCurrency(category.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Edit Member Modal */}
                {editingMember && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md bg-white">
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

                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" onClick={() => setEditingMember(null)}>
                                            Cancelar
                                        </Button>
                                        <Button
                                            onClick={() => handleUpdateMember(editingMember.userId, editingMember.permission)}
                                            className="text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            Salvar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Settings Modal */}
                {showSettings && profile?.isUserAdmin && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md bg-white">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Configurações da Conta
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                                        ✕
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nome da Conta</Label>
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Nome da conta colaborativa"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Descrição</Label>
                                        <Input
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Descrição da conta (opcional)"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4 justify-end">
                                        <Button variant="outline" onClick={() => setShowSettings(false)}>
                                            Cancelar
                                        </Button>
                                        <Button onClick={handleUpdateProfile} className="text-white bg-blue-600 hover:bg-blue-700">
                                            Salvar
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
