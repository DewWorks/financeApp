"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from "@/components/ui/molecules/Title"
import { Users, ArrowLeft } from 'lucide-react'
import axios from "axios"
import Swal from "sweetalert2"

export default function CreateProfilePage() {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: "Nome da conta é obrigatório.",
            })
            return
        }

        setLoading(true)

        try {
            const response = await axios.post("/api/profiles", {
                name: name.trim(),
                type: "SHARED",
                description: description.trim(),
            })

            if (response.status === 201) {
                Swal.fire({
                    icon: "success",
                    title: "Sucesso!",
                    text: "Conta colaborativa criada com sucesso!",
                    confirmButtonText: "Continuar",
                    timer: 3000,
                }).then(() => {
                    // Trocar para o novo profile
                    localStorage.setItem("current-profile-id", response.data.profileId)
                    localStorage.setItem("current-profile-name", name)
                    router.push("/")
                })
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Erro ao criar conta colaborativa."
            Swal.fire({
                icon: "error",
                title: "Erro!",
                text: errorMessage,
            })
        } finally {
            setLoading(false)
        }
    }

    const goBack = () => {
        router.push("/")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader className="flex items-center justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-blue-500" />
                        <Title />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Criar Conta Colaborativa</CardTitle>
                    <p className="text-center text-gray-600 mt-2">Compartilhe suas finanças com outras pessoas</p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nome da Conta */}
                        <div className="space-y-2">
                            <Label className="text-lg" htmlFor="name">
                                Nome da Conta
                            </Label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="border-2 border-slate-300 focus:border-blue-500"
                                placeholder="Ex: Família Silva, Empresa XYZ"
                                required
                            />
                        </div>

                        {/* Descrição (Opcional) */}
                        <div className="space-y-2">
                            <Label className="text-lg" htmlFor="description">
                                Descrição (Opcional)
                            </Label>
                            <Input
                                id="description"
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border-2 border-slate-300 focus:border-blue-500"
                                placeholder="Descreva o propósito desta conta"
                            />
                        </div>

                        {/* Informações */}
                        <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Como funciona:</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Você será o administrador da conta</li>
                                <li>• Poderá adicionar outros membros depois</li>
                                <li>• Todos verão as mesmas transações</li>
                                <li>• Pode trocar entre contas a qualquer momento</li>
                            </ul>
                        </div>

                        {/* Botões */}
                        <div className="space-y-3 pt-4">
                            <Button
                                type="submit"
                                className="w-full text-lg bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={loading}
                            >
                                {loading ? "Criando..." : "Criar Conta Colaborativa"}
                            </Button>

                            <Button
                                type="button"
                                onClick={goBack}
                                className="w-full text-lg bg-gray-600 hover:bg-gray-700 text-white flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
