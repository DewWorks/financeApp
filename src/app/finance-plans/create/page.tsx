"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Textarea } from "@/components/ui/atoms/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select"
import { Badge } from "@/components/ui/atoms/badge"
import { Progress } from "@/components/ui/atoms/progress"
import { Target, ArrowLeft, MapPin, Home, Car, GraduationCap, Shield, TrendingUp, Calculator } from "lucide-react"
import Swal from "sweetalert2"

const categories = [
    { value: "travel", label: "Viagem", icon: MapPin, color: "text-blue-600" },
    { value: "house", label: "Casa", icon: Home, color: "text-green-600" },
    { value: "car", label: "Carro", icon: Car, color: "text-red-600" },
    { value: "education", label: "Educação", icon: GraduationCap, color: "text-purple-600" },
    { value: "emergency", label: "Emergência", icon: Shield, color: "text-orange-600" },
    { value: "investment", label: "Investimento", icon: TrendingUp, color: "text-indigo-600" },
    { value: "other", label: "Outro", icon: Target, color: "text-gray-600" },
]

const priorities = [
    { value: "low", label: "Baixa", color: "text-gray-600" },
    { value: "medium", label: "Média", color: "text-yellow-600" },
    { value: "high", label: "Alta", color: "text-red-600" },
]

export default function CreateFinancePlanPage() {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "",
        targetAmount: "",
        currentAmount: "",
        desiredDate: "",
        priority: "medium",
    })
    const [loading, setLoading] = useState(false)
    const [calculation, setCalculation] = useState<any>(null)
    const router = useRouter()

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    const calculatePreview = () => {
        const { targetAmount, currentAmount, desiredDate } = formData

        if (!targetAmount || !currentAmount || !desiredDate) return

        const target = Number.parseFloat(targetAmount)
        const current = Number.parseFloat(currentAmount)
        const date = new Date(desiredDate)
        const now = new Date()

        if (target <= 0 || current < 0 || date <= now) return

        const monthsRemaining = Math.max(1, Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
        const amountNeeded = Math.max(0, target - current)
        const monthlySaving = amountNeeded / monthsRemaining
        const weeklySaving = monthlySaving / 4.33
        const dailySaving = monthlySaving / 30

        let difficulty = "easy"
        if (monthlySaving > 5000) difficulty = "hard"
        else if (monthlySaving > 2000) difficulty = "medium"

        setCalculation({
            monthsRemaining,
            amountNeeded,
            monthlySaving,
            weeklySaving,
            dailySaving,
            difficulty,
            progressPercentage: (current / target) * 100,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await axios.post("/api/finance-plans", {
                name: formData.name.trim(),
                description: formData.description.trim(),
                category: formData.category,
                targetAmount: Number.parseFloat(formData.targetAmount),
                currentAmount: Number.parseFloat(formData.currentAmount) || 0,
                desiredDate: formData.desiredDate,
                priority: formData.priority,
            })

            if (response.status === 200) {
                Swal.fire({
                    icon: "success",
                    title: "Plano Criado!",
                    text: "Seu plano financeiro foi criado com sucesso!",
                    timer: 3000,
                }).then(() => {
                    router.push("/finance-plans")
                })
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Erro ao criar plano financeiro."
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    // Calculate preview when relevant fields change
    React.useEffect(() => {
        calculatePreview()
    }, [formData.targetAmount, formData.currentAmount, formData.desiredDate])

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" onClick={() => router.push("/finance-plans")} className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Target className="w-8 h-8 text-blue-600" />
                            Criar Plano Financeiro
                        </h1>
                        <p className="text-gray-600 mt-2">Defina seu objetivo e receba um plano personalizado</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações do Plano</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Objetivo *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="Ex: Viagem para Europa"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição (Opcional)</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        placeholder="Descreva mais detalhes sobre seu objetivo..."
                                        rows={3}
                                    />
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <Label>Categoria *</Label>
                                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma categoria" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => {
                                                const Icon = category.icon
                                                return (
                                                    <SelectItem key={category.value} value={category.value}>
                                                        <div className="flex items-center gap-2">
                                                            <Icon className={`w-4 h-4 ${category.color}`} />
                                                            {category.label}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Amounts */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="targetAmount">Valor da Meta *</Label>
                                        <Input
                                            id="targetAmount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.targetAmount}
                                            onChange={(e) => handleInputChange("targetAmount", e.target.value)}
                                            placeholder="10000.00"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="currentAmount">Valor Atual</Label>
                                        <Input
                                            id="currentAmount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.currentAmount}
                                            onChange={(e) => handleInputChange("currentAmount", e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Date and Priority */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="desiredDate">Data Desejada *</Label>
                                        <Input
                                            id="desiredDate"
                                            type="date"
                                            value={formData.desiredDate}
                                            onChange={(e) => handleInputChange("desiredDate", e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Prioridade</Label>
                                        <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {priorities.map((priority) => (
                                                    <SelectItem key={priority.value} value={priority.value}>
                                                        <span className={priority.color}>{priority.label}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                                    {loading ? "Criando..." : "Criar Plano"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Preview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="w-5 h-5" />
                                Prévia do Plano
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {calculation ? (
                                <div className="space-y-4">
                                    {/* Progress */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Progresso Atual</span>
                                            <span>{calculation.progressPercentage.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={calculation.progressPercentage} className="h-2" />
                                    </div>

                                    {/* Amount needed */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-blue-800 mb-2">Valor Necessário</h4>
                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculation.amountNeeded)}</p>
                                    </div>

                                    {/* Savings breakdown */}
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600">Por mês</p>
                                            <p className="text-lg font-semibold">{formatCurrency(calculation.monthlySaving)}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600">Por semana</p>
                                            <p className="text-lg font-semibold">{formatCurrency(calculation.weeklySaving)}</p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <p className="text-sm text-gray-600">Por dia</p>
                                            <p className="text-lg font-semibold">{formatCurrency(calculation.dailySaving)}</p>
                                        </div>
                                    </div>

                                    {/* Difficulty */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Dificuldade:</span>
                                        <Badge
                                            className={
                                                calculation.difficulty === "easy"
                                                    ? "bg-green-100 text-green-800"
                                                    : calculation.difficulty === "medium"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-red-100 text-red-800"
                                            }
                                        >
                                            {calculation.difficulty === "easy"
                                                ? "Fácil"
                                                : calculation.difficulty === "medium"
                                                    ? "Médio"
                                                    : "Difícil"}
                                        </Badge>
                                    </div>

                                    {/* Time remaining */}
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Tempo restante</p>
                                        <p className="text-lg font-semibold">{calculation.monthsRemaining} meses</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Preencha os campos para ver a prévia do seu plano</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
