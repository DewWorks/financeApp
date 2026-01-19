"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/atoms/card"
import { Button } from "@/components/ui/atoms/button"
import { Title } from "@/components/ui/molecules/Title"
import { Loader2, ShieldCheck, Landmark, Plus, RefreshCw, Wallet, ChevronLeft } from "lucide-react"
import Swal from "sweetalert2"
import dynamic from 'next/dynamic';

// Carregamento dinâmico para evitar erros de SSR e Tipagem
const PluggyConnect = dynamic(
    () => import('react-pluggy-connect').then((mod: any) => mod.default || mod.PluggyConnect || mod),
    {
        ssr: false,
        loading: () => <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
    }
) as any;

export default function BankConnectPage() {
    const [connectToken, setConnectToken] = useState<string | null>(null)
    const [loadingToken, setLoadingToken] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [showWidget, setShowWidget] = useState(false)
    const [connections, setConnections] = useState<any[]>([])
    const [loadingConnections, setLoadingConnections] = useState(true)

    const router = useRouter()

    const fetchConnections = async () => {
        setLoadingConnections(true)
        try {
            const response = await fetch('/api/bank-connections')
            if (response.ok) {
                const data = await response.json()
                setConnections(data)
            }
        } catch (error) {
            console.error("Erro ao buscar conexões:", error)
        } finally {
            setLoadingConnections(false)
        }
    }

    useEffect(() => {
        fetchConnections()
    }, [])

    const handleStartConnection = async () => {
        setLoadingToken(true)
        setShowWidget(true)
        try {
            const response = await fetch('/api/pluggy/create-token', { method: 'POST' })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.details || data.error || "Falha ao criar token")
            }

            if (data.accessToken) {
                setConnectToken(data.accessToken)
            } else {
                setErrorMsg("Nenhum token recebido da API")
            }
        } catch (error: any) {
            console.error("Error fetching connect token:", error)
            setErrorMsg(error.message || "Erro desconhecido")
        } finally {
            setLoadingToken(false)
        }
    }

    const handleSuccess = async (itemData: any) => {
        console.log("Conexão bem sucedida:", itemData)
        try {
            await fetch('/api/bank-connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item: itemData.item })
            })

            Swal.fire({
                icon: 'success',
                title: 'Conexão Realizada!',
                text: 'Seus dados bancários foram sincronizados.',
                timer: 3000
            })

            setShowWidget(false)
            setConnectToken(null)
            fetchConnections() // Atualiza a lista
        } catch (error) {
            console.error("Erro ao salvar conexão:", error)
        }
    }

    const handleError = (error: any) => {
        console.error("Erro na conexão:", error)
        Swal.fire({
            icon: 'error',
            title: 'Erro na Conexão',
            text: 'Não foi possível conectar ao banco. Tente novamente.'
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Back Button */}
                <div className="mb-4">
                    <Button
                        variant="ghost"
                        className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => router.push('/')}
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Voltar para o Dashboard
                    </Button>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Landmark className="text-blue-600" /> Minhas Contas
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie suas conexões bancárias via Open Finance</p>
                    </div>
                    {!showWidget && (
                        <Button onClick={handleStartConnection} size="lg" className="shadow-lg text-white">
                            <Plus className="mr-2 h-5 w-5" /> Nova Conexão
                        </Button>
                    )}
                </div>

                {/* Lista de Conexões */}
                {!showWidget && (
                    <div className="grid grid-cols-1 gap-6">
                        {loadingConnections ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            </div>
                        ) : connections.length === 0 ? (
                            <Card className="text-center p-12 border-dashed">
                                <CardContent className="flex flex-col items-center">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                                        <Wallet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">Nenhuma conta conectada</h3>
                                    <p className="text-muted-foreground mb-6 max-w-md">
                                        Conecte suas contas bancárias para sincronizar transações e saldo automaticamente.
                                    </p>
                                    <Button onClick={handleStartConnection}>Conectar minha primeira conta</Button>
                                </CardContent>
                            </Card>
                        ) : (
                            connections.map((conn) => (
                                <Card key={conn._id} className="overflow-hidden border-l-4 border-l-blue-500 shadow-md">
                                    <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4 items-center">
                                                {/* Se tiver URL de imagem do banco, poderia por aqui. Por enquanto um icone genérico */}
                                                <div className="bg-white p-2 rounded-lg shadow-sm border">
                                                    <Landmark className="h-6 w-6 text-gray-700" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">Conexão Bancária</CardTitle>
                                                    <CardDescription className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${conn.status === 'UPDATED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                            {conn.status}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            Atualizado em: {new Date(conn.lastSyncAt).toLocaleString()}
                                                        </span>
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={fetchConnections}>
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Contas Sincronizadas</h4>
                                        <div className="space-y-3">
                                            {conn.accounts.map((acc: any) => (
                                                <div key={acc.accountId} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-300 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Wallet className="h-5 w-5 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium">{acc.name}</p>
                                                            <p className="text-xs text-gray-500">{acc.type} • {acc.number}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`font-bold ${acc.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {acc.currency} {acc.balance.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                {/* Widget de Conexão (Modal/Card Overlay) */}
                {showWidget && (
                    <Card className="w-full bg-card animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader className="text-center relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute left-0 top-0 m-4"
                                onClick={() => { setShowWidget(false); setConnectToken(null); }}
                            >
                                ← Voltar
                            </Button>
                            <div className="flex items-center justify-center gap-3 mb-2 pt-2">
                                <ShieldCheck className="w-6 h-6 text-green-500" />
                                <Title />
                            </div>
                            <CardTitle>Conectar Nova Conta</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
                            {loadingToken ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <p className="text-muted-foreground">Preparando ambiente seguro...</p>
                                </div>
                            ) : connectToken ? (
                                <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                                    <PluggyConnect
                                        connectToken={connectToken}
                                        includeSandbox={true}
                                        onSuccess={handleSuccess}
                                        onError={handleError}
                                    />
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <p className="text-red-500 font-medium">Erro ao iniciar conexão</p>
                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm text-red-600 dark:text-red-400">
                                        {errorMsg || "Tente novamente mais tarde."}
                                    </div>
                                    <Button onClick={handleStartConnection}>Tentar Novamente</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
