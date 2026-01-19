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
    Settings,
    UserPlus,
    Activity,
} from "lucide-react"
import Swal from "sweetalert2"
import { ITransaction } from "@/interfaces/ITransaction"
import { useCurrentProfile } from "@/hooks/useCurrentProfile"
import { DashboardSkeleton } from "@/components/ui/atoms/DashboardSkeleton"

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
    recentTransactions: ITransaction[]
    topCategories: string[]
}

export default function CollaborativeDetailsPage() {
    const { currentProfileId, isLoading: isProfileLoading } = useCurrentProfile()
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
        if (!isProfileLoading) {
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
            fetchProfileData(currentProfileId)
            fetchProfileStats(currentProfileId)
        }
    }, [currentProfileId, isProfileLoading])


    const fetchProfileData = async (profileId: string) => {
        try {
            const response = await axios.get(`/api/profiles/${profileId}/details`)

            if (response.status === 200) {
                const profileData = response.data
                setProfile(profileData)
                setEditName(profileData.name)
                setEditDescription(profileData.description || "")
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao carregar perfil colaborativo.";
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

    const fetchProfileStats = async (profileId: string) => {
        try {
            const response = await axios.get(`/api/profiles/${profileId}/stats`)
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
               📬 Um email de boas-vindas foi enviado.
             </p>
           </div>
         `,
                    confirmButtonText: "Entendi",
                    timer: 5000,
                })

                setNewMemberEmail("")
                setNewMemberPhone("")
                setNewMemberPermission("COLABORATOR")
                setShowAddMember(false)
                if (currentProfileId) fetchProfileData(currentProfileId)
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao adicionar membro.";
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
                profileId: profile?._id,
                memberId
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
           </div>
         `,
                    confirmButtonText: "Entendi",
                    timer: 4000,
                })

                if (currentProfileId) fetchProfileData(currentProfileId)
                setEditingMember(null)
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao atualizar membro.";
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
            html: `Remover <strong>${memberName}</strong>? Esta ação não pode ser desfeita.`,
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
                        title: "Membro Removido!",
                        text: "O membro foi removido com sucesso.",
                        timer: 2000,
                    })

                    if (currentProfileId) fetchProfileData(currentProfileId)
                }
            } catch (error: unknown) {
                const err = error as { response?: { data?: { error?: string } } };
                const errorMessage = err.response?.data?.error || "Erro ao remover membro.";
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
                if (currentProfileId) fetchProfileData(currentProfileId)

                // Atualizar localStorage se necessário
                localStorage.setItem("current-profile-name", editName.trim())
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            const errorMessage = err.response?.data?.error || "Erro ao atualizar conta.";
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
                return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
            case "COLABORATOR":
                return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800"
            case "VIEWER":
                return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            default:
                return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"
        }
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

    if (loading || isProfileLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-background p-4 sm:p-8 flex items-center justify-center">
                <DashboardSkeleton />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <Card className="mb-6 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">{profile?.name}</CardTitle>
                                    <p className="text-gray-600 dark:text-gray-400 mt-1">{profile?.description}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                        Criada em {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ""}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {profile?.isUserAdmin && (
                                    <Button onClick={() => setShowSettings(true)} variant="outline" className="flex items-center gap-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                                        <Settings className="w-4 h-4" />
                                        Configurações
                                    </Button>
                                )}
                                <Button onClick={goBack} variant="outline" className="flex items-center gap-2 bg-transparent dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
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
                        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Receitas (Mês)</p>
                                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(stats.monthly.income)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Despesas (Mês)</p>
                                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">{formatCurrency(stats.monthly.expense)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Saldo (Mês)</p>
                                        <p
                                            className={`text-lg font-semibold ${stats.monthly.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                        >
                                            {formatCurrency(stats.monthly.balance)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Transações</p>
                                        <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">{stats.monthly.transactionCount}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Members Management */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
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
                                    <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <h4 className="font-medium mb-4 text-gray-900 dark:text-gray-100">Adicionar Novo Membro</h4>
                                        <form onSubmit={handleAddMember} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email *</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={newMemberEmail}
                                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                                        placeholder="usuario@exemplo.com"
                                                        required
                                                        className="bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Telefone (Opcional)</Label>
                                                    <Input
                                                        id="phone"
                                                        type="tel"
                                                        value={newMemberPhone}
                                                        onChange={(e) => {
                                                            const formatted = e.target.value.replace(/\D/g, "").replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
                                                            setNewMemberPhone(formatted);
                                                        }}
                                                        placeholder="(11) 99999-9999"
                                                        maxLength={15}
                                                        className="bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="permission" className="text-gray-700 dark:text-gray-300">Permissão</Label>
                                                <select
                                                    id="permission"
                                                    value={newMemberPermission}
                                                    onChange={(e) =>
                                                        setNewMemberPermission(e.target.value as "ADMIN" | "COLABORATOR" | "VIEWER")
                                                    }
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                                                    className="text-white bg-blue-600 hover:bg-blue-700"
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
                                                    className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
                                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>

                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{member.userName}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                        <Mail className="w-3 h-3" />
                                                        {member.userEmail}
                                                    </div>
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
                                                            className="p-1 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                                        >
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRemoveMember(member.userId, member.userName)}
                                                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-gray-700"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {(!profile?.members || profile.members.length === 0) && (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
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
                            <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Activity className="w-5 h-5" />
                                        Transações Recentes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {stats.recentTransactions.slice(0, 5).map((transaction, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</p>
                                                    <p className="text-gray-500 dark:text-gray-500 text-xs">{new Date(transaction.date).toLocaleDateString()}</p>
                                                </div>
                                                <span
                                                    className={`font-medium ${transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
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
                    </div>
                </div>

                {/* Edit Member Modal */}
                {editingMember && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-gray-100">Editar Permissão</CardTitle>
                                <p className="text-gray-600 dark:text-gray-400">{editingMember.userName}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Nova Permissão</Label>
                                        <select
                                            value={editingMember.permission}
                                            onChange={(e) =>
                                                setEditingMember({
                                                    ...editingMember,
                                                    permission: e.target.value as "ADMIN" | "COLABORATOR" | "VIEWER",
                                                })
                                            }
                                            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                        >
                                            <option value="VIEWER">Visualizador - Apenas visualizar</option>
                                            <option value="COLABORATOR">Colaborador - Adicionar e editar transações</option>
                                            <option value="ADMIN">Administrador - Controle total</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" onClick={() => setEditingMember(null)} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
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
                        <Card className="w-full max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Settings className="w-5 h-5" />
                                        Configurações da Conta
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        ✕
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Nome da Conta</Label>
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder="Nome da conta colaborativa"
                                            className="bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Descrição</Label>
                                        <Input
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            placeholder="Descrição da conta (opcional)"
                                            className="bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-4 justify-end">
                                        <Button variant="outline" onClick={() => setShowSettings(false)} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
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
