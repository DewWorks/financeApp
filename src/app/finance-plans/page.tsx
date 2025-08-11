"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Badge } from "@/components/ui/atoms/badge"
import { Progress } from "@/components/ui/atoms/progress"
import {
    Target,
    Plus,
    MapPin,
    Home,
    Car,
    GraduationCap,
    Shield,
    TrendingUp,
    Calendar,
    DollarSign,
    Edit,
    Trash2,
    CheckCircle,
} from "lucide-react"
import Swal from "sweetalert2"

interface FinancePlan {
    _id: string
    name: string
    description?: string
    category: string
    targetAmount: number
    currentAmount: number
    desiredDate: string
    priority: "low" | "medium" | "high"
    status: "active" | "completed" | "paused"
    createdAt: string
    calculation: {
        monthsRemaining: number
        amountNeeded: number
        monthlySaving: number
        difficulty: "easy" | "medium" | "hard"
        progressPercentage: number
    }
}

const categories = {
    travel: { label: "Viagem", icon: MapPin, color: "text-blue-600" },
    house: { label: "Casa", icon: Home, color: "text-green-600" },
    car: { label: "Carro", icon: Car, color: "text-red-600" },
    education: { label: "Educação", icon: GraduationCap, color: "text-purple-600" },
    emergency: { label: "Emergência", icon: Shield, color: "text-orange-600" },
    investment: { label: "Investimento", icon: TrendingUp, color: "text-indigo-600" },
    other: { label: "Outro", icon: Target, color: "text-gray-600" },
}

const priorities = {
    low: { label: "Baixa", color: "bg-gray-100 text-gray-800" },
    medium: { label: "Média", color: "bg-yellow-100 text-yellow-800" },
    high: { label: "Alta", color: "bg-red-100 text-red-800" },
}

const difficulties = {
    easy: { label: "Fácil", color: "bg-green-100 text-green-800" },
    medium: { label: "Médio", color: "bg-yellow-100 text-yellow-800" },
    hard: { label: "Difícil", color: "bg-red-100 text-red-800" },
}

export default function FinancePlansPage() {
    const [plans, setPlans] = useState<FinancePlan[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
    const router = useRouter()

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const response = await axios.get("/api/finance-plans")
            setPlans(response.data.plans || [])
        } catch (error) {
            console.error("Error fetching plans:", error)
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "Erro ao carregar planos financeiros.",
            })
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR")
    }

    const handleDeletePlan = async (planId: string, planName: string) => {
        const result = await Swal.fire({
            title: "Tem certeza?",
            text: `Deseja excluir o plano "${planName}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Sim, excluir",
            cancelButtonText: "Cancelar",
        })

        if (result.isConfirmed) {
            try {
                await axios.delete(`/api/finance-plans/${planId}`)
                Swal.fire("Excluído!", "Plano financeiro excluído com sucesso.", "success")
                fetchPlans()
            } catch (error) {
                Swal.fire("Erro!", "Erro ao excluir plano financeiro.", "error")
            }
        }
    }

    const handleMarkComplete = async (planId: string) => {
        try {
            await axios.patch(`/api/finance-plans/${planId}`, { status: "completed" })
            Swal.fire("Parabéns!", "Plano marcado como concluído!", "success")
            fetchPlans()
        } catch (error) {
            Swal.fire("Erro!", "Erro ao atualizar plano.", "error")
        }
    }

    const filteredPlans = plans.filter((plan) => {
        if (filter === "all") return true
        return plan.status === filter
    })

    const stats = {
        total: plans.length,
        active: plans.filter((p) => p.status === "active").length,
        completed: plans.filter((p) => p.status === "completed").length,
        totalTarget: plans.reduce((sum, p) => sum + p.targetAmount, 0),
        totalSaved: plans.reduce((sum, p) => sum + p.currentAmount, 0),
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Carregando planos financeiros...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Target className="w-8 h-8 text-blue-600" />
                            Planos Financeiros
                        </h1>
                        <p className="text-gray-600 mt-2">Gerencie seus objetivos financeiros e acompanhe seu progresso</p>
                    </div>
                    <Button
                        onClick={() => router.push("/finance-plans/create")}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Plano
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Target className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total de Planos</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Concluídos</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <DollarSign className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Meta Total</p>
                                    <p className="text-lg font-bold text-purple-600">{formatCurrency(stats.totalTarget)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Poupado</p>
                                    <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.totalSaved)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
                        Todos ({stats.total})
                    </Button>
                    <Button variant={filter === "active" ? "default" : "outline"} onClick={() => setFilter("active")} size="sm">
                        Ativos ({stats.active})
                    </Button>
                    <Button
                        variant={filter === "completed" ? "default" : "outline"}
                        onClick={() => setFilter("completed")}
                        size="sm"
                    >
                        Concluídos ({stats.completed})
                    </Button>
                </div>

                {/* Plans Grid */}
                {filteredPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlans.map((plan) => {
                            const category = categories[plan.category as keyof typeof categories] || categories.other
                            const Icon = category.icon

                            return (
                                <Card key={plan._id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <Icon className={`w-5 h-5 ${category.color}`} />
                                                <CardTitle className="text-lg">{plan.name}</CardTitle>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline" className="p-1 bg-transparent">
                                                    <Edit className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeletePlan(plan._id, plan.name)}
                                                    className="p-1 text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        {plan.description && <p className="text-sm text-gray-600 mt-1">{plan.description}</p>}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Progress */}
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Progresso</span>
                                                <span>{plan.calculation.progressPercentage.toFixed(1)}%</span>
                                            </div>
                                            <Progress value={plan.calculation.progressPercentage} className="h-2" />
                                        </div>

                                        {/* Amounts */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-600">Atual</p>
                                                <p className="font-semibold">{formatCurrency(plan.currentAmount)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Meta</p>
                                                <p className="font-semibold">{formatCurrency(plan.targetAmount)}</p>
                                            </div>
                                        </div>

                                        {/* Monthly saving */}
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <p className="text-sm text-blue-600">Economizar por mês</p>
                                            <p className="font-bold text-blue-800">{formatCurrency(plan.calculation.monthlySaving)}</p>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-2">
                                            <Badge className={priorities[plan.priority].color}>{priorities[plan.priority].label}</Badge>
                                            <Badge className={difficulties[plan.calculation.difficulty].color}>
                                                {difficulties[plan.calculation.difficulty].label}
                                            </Badge>
                                            {plan.status === "completed" && <Badge className="bg-green-100 text-green-800">Concluído</Badge>}
                                        </div>

                                        {/* Date and Actions */}
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(plan.desiredDate)}
                                            </div>
                                            {plan.status === "active" && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMarkComplete(plan._id)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    Concluir
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Target className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {filter === "all"
                                    ? "Nenhum plano encontrado"
                                    : `Nenhum plano ${filter === "active" ? "ativo" : "concluído"}`}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {filter === "all"
                                    ? "Comece criando seu primeiro plano financeiro"
                                    : `Você não tem planos ${filter === "active" ? "ativos" : "concluídos"} no momento`}
                            </p>
                            {filter === "all" && (
                                <Button onClick={() => router.push("/finance-plans/create")} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Criar Primeiro Plano
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
