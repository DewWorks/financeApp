"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from "@/components/ui/molecules/Title"
import { User, Mail, Phone, ArrowLeft } from "lucide-react"
import Swal from "sweetalert2"

interface UserProfile {
    name: string
    email: string
    cel: string[]
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
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
                    setUser(response.data)
                }
            }  catch (error: unknown) {
                const err = error as { response?: { data?: { error?: string } } };
                const errorMessage = err.response?.data?.error || "Erro ao carregar perfil";
                Swal.fire({
                    icon: "error",
                    title: "Erro!",
                    text: errorMessage,
                })
            } finally {
                setLoading(false)
            }
        }

        fetchUserProfile()
    }, [router])

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
                            <p className="text-gray-600">Carregando perfil...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader className="flex items-center justify-center">
                    <Title />
                    <CardTitle className="text-2xl font-bold text-center">Meu Perfil</CardTitle>
                    <p className="text-center text-gray-600 mt-2">Suas informações pessoais</p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {user && (
                        <>
                            {/* Nome */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <User className="w-5 h-5 text-blue-600" />
                                    <span className="text-lg font-medium">Nome</span>
                                </div>
                                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                                    <p className="text-xl text-gray-800">{user.name}</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                    <span className="text-lg font-medium">Email</span>
                                </div>
                                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                                    <p className="text-xl text-gray-800">{user.email}</p>
                                </div>
                            </div>

                            {/* Telefone */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Phone className="w-5 h-5 text-blue-600" />
                                    <span className="text-lg font-medium">Telefone</span>
                                </div>
                                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-3">
                                    {user.cel && user.cel.length > 0 ? (
                                        <p className="text-xl text-gray-800">
                                            {user.cel[0].replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
                                        </p>
                                    ) : (
                                        <p className="text-xl text-gray-500">Não informado</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Botões */}
                    <div className="space-y-3 pt-4">
                        <Button
                            onClick={goBack}
                            className="w-full text-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Voltar ao Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
