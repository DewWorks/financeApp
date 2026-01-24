"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/atoms/card"
import { Button } from "@/components/ui/atoms/button"
import { Title } from "@/components/ui/molecules/Title"
import { Loader2, ShieldCheck, Landmark, Plus, RefreshCw, Wallet, ChevronLeft, Trash2, ArrowRight } from "lucide-react"
import Swal from "sweetalert2"
import dynamic from 'next/dynamic';
import { getBankDetails } from "@/lib/utils"

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

    const handleDeleteConnection = async (itemId: string, bankName: string) => {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: `Deseja remover a conexão com ${bankName}? Seus dados não serão mais sincronizados.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/bank-connections?itemId=${itemId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    Swal.fire(
                        'Removido!',
                        'A conexão foi removida com sucesso.',
                        'success'
                    );
                    fetchConnections();
                } else {
                    throw new Error('Falha ao deletar');
                }
            } catch (error) {
                Swal.fire(
                    'Erro',
                    'Não foi possível remover a conexão.',
                    'error'
                );
            }
        }
    };

    const handleForceSync = async (itemId: string) => {
        let timerInterval: NodeJS.Timeout;

        Swal.fire({
            title: '<span class="text-xl font-bold">Sincronizando...</span>',
            html: `
                <div class="flex flex-col items-center gap-4 py-4">
                    <div class="relative">
                        <div class="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <div class="absolute inset-0 flex items-center justify-center">
                            <span class="text-xs font-bold text-blue-600">AI</span>
                        </div>
                    </div>
                    <div class="space-y-2 text-center">
                        <b id="swal-step" class="text-lg text-gray-700">Conectando ao banco...</b>
                        <p id="swal-progress" class="text-sm text-gray-500">Iniciando protocolo de segurança</p>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2 overflow-hidden">
                        <div id="swal-bar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style="width: 5%"></div>
                    </div>
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            didOpen: () => {
                const b = Swal.getHtmlContainer()?.querySelector('#swal-step');
                const p = Swal.getHtmlContainer()?.querySelector('#swal-progress');
                const bar = Swal.getHtmlContainer()?.querySelector('#swal-bar') as HTMLElement;

                let progress = 5;
                const steps = [
                    { pct: 20, msg: "Buscando transações...", sub: "Acessando dados criptografados" },
                    { pct: 45, msg: "Analisando dados...", sub: "Identificando padrões de consumo" },
                    { pct: 60, msg: "Inteligência Artificial...", sub: "Categorizando e limpando descrições com Gemini" },
                    { pct: 80, msg: "Quase lá...", sub: "Salvando no banco de dados seguro" },
                    { pct: 90, msg: "Finalizando...", sub: "Atualizando dashboard" }
                ];
                let stepIndex = 0;

                timerInterval = setInterval(() => {
                    if (stepIndex < steps.length) {
                        const step = steps[stepIndex];
                        progress = step.pct;
                        if (b) b.textContent = step.msg;
                        if (p) p.textContent = step.sub;
                        if (bar) bar.style.width = `${progress}%`;
                        stepIndex++;
                    }
                }, 1500); // Update every 1.5s to simulate work
            },
            willClose: () => {
                clearInterval(timerInterval);
            }
        });

        try {
            const response = await fetch(`/api/bank-connections/sync?itemId=${itemId}`, {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                await fetchConnections();

                const newCount = data.transactions?.new || 0;
                const updatedCount = data.transactions?.updated || 0;

                Swal.fire({
                    icon: 'success',
                    title: '<span class="text-xl font-bold">Atualizado!</span>',
                    html: `
                        <div class="space-y-2 mt-2">
                            <p class="text-gray-600">Sincronização concluída com sucesso.</p>
                            <div class="flex justify-center gap-4 text-sm">
                                <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">+${newCount} Novas</span>
                                <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">${updatedCount} Atualizadas</span>
                            </div>
                        </div>
                    `,
                    timer: 3000,
                    showConfirmButton: false
                });
            } else {
                const data = await response.json();

                // Connection Broken / Invalid
                if (response.status === 400 || response.status === 404) {
                    const result = await Swal.fire({
                        title: 'Conexão Expirada',
                        text: 'O banco recusou a conexão (pode ter sido removida ou expirada). É necessário reconectar.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Remover e Reconectar',
                        cancelButtonText: 'Cancelar'
                    });

                    if (result.isConfirmed) {
                        // Find the bank name for the delete function
                        const conn = connections.find(c => c.itemId === itemId);
                        const bankName = conn?.accounts?.[0]?.name || "Banco";
                        await handleDeleteConnection(itemId, bankName);
                        // Open new connection modal
                        handleStartConnection();
                    }
                    return; // Exit
                }

                throw new Error(data.error || 'Falha na sincronização');
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: error.message || 'Não foi possível atualizar. Tente novamente.'
            });
        }
    };

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
                        <Button onClick={handleStartConnection} size="lg" className="shadow-lg text-white gap-2">
                            <Plus className="h-5 w-5" /> Nova Conexão
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
                            connections.map((conn) => {
                                // Obter conta representativa para nome e logo do banco
                                const mainAccount = conn.accounts && conn.accounts.length > 0 ? conn.accounts[0] : { name: 'Banco Desconhecido' };
                                const bankDetails = getBankDetails(mainAccount.name);

                                const checkingTypes = ["CHECKING_ACCOUNT", "SAVINGS_ACCOUNT", "PAYMENT_ACCOUNT", "BANK"];
                                const checkingAccounts = conn.accounts.filter((acc: any) =>
                                    acc.type && checkingTypes.includes(acc.type.toUpperCase())
                                );
                                const creditAccounts = conn.accounts.filter((acc: any) =>
                                    acc.type && (acc.type.toUpperCase() === "CREDIT_CARD" || acc.type.toUpperCase() === "CREDIT")
                                );

                                return (
                                    <Card key={conn._id} className="overflow-hidden border-none shadow-md ring-1 ring-gray-200 dark:ring-gray-700">
                                        <div className="h-2 w-full" style={{ backgroundColor: bankDetails.color }} />
                                        <CardHeader className="bg-white dark:bg-gray-800 pb-4">
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex gap-4 items-center">
                                                    <div className="bg-white p-2 rounded-xl shadow-sm border h-12 w-12 flex items-center justify-center">
                                                        <img src={bankDetails.logo} alt="Logo Banco" className="h-8 w-8 object-contain" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            {mainAccount.name.split(' - ')[0]}
                                                        </CardTitle>
                                                        <CardDescription className="flex items-center gap-2 mt-1">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${conn.status === 'UPDATED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {conn.status === 'UPDATED' ? 'Atualizado' : conn.status}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                • Atualizado em: {new Date(conn.lastSyncAt).toLocaleString()}
                                                            </span>
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleForceSync(conn.itemId)}
                                                        className="flex-1 sm:flex-none gap-2 bg-blue-600 text-white hover:bg-blue-800"
                                                    >
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                        Atualizar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteConnection(conn.itemId, mainAccount.name)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0 bg-gray-50/50 dark:bg-gray-800/50 border-t">
                                            <div className="space-y-6 mt-6">
                                                {/* Seção de Contas Correntes */}
                                                {checkingAccounts.length > 0 && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Contas</h4>
                                                        {checkingAccounts.map((acc: any) => (
                                                            <div key={acc.accountId} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500">
                                                                        <Wallet className="h-4 w-4" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-medium text-sm text-gray-700 dark:text-gray-200">{acc.name}</p>
                                                                        <p className="text-xs text-gray-500">{acc.type} • **** {acc.number ? acc.number.slice(-4) : '****'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`font-bold text-sm ${acc.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                                        {acc.currency} {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Seção de Cartões de Crédito (Cards Visuais) */}
                                                {creditAccounts.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Cartões de Crédito</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {creditAccounts.map((acc: any) => (
                                                                <div
                                                                    key={acc.accountId}
                                                                    className="relative w-full h-48 rounded-2xl p-5 flex flex-col justify-between text-white shadow-lg overflow-hidden transition-transform hover:scale-[1.01]"
                                                                    style={{ background: bankDetails.color }}
                                                                >
                                                                    {/* Background Decorativo */}
                                                                    <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                                                    <div className="absolute left-0 bottom-0 w-32 h-32 bg-black/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                                                                    <div className="flex justify-between items-start z-10 relative">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="bg-white/95 p-1.5 rounded-md shadow-sm">
                                                                                <img src={bankDetails.logo} alt={acc.name} className="h-5 w-5 object-contain" />
                                                                            </div>
                                                                            <span className="font-bold text-sm tracking-wide text-white/95 drop-shadow-md truncate max-w-[120px]">
                                                                                {acc.name}
                                                                            </span>
                                                                        </div>
                                                                        {/* Chip Simulado */}
                                                                        <div className="w-9 h-7 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded sm:rounded-md opacity-90 border border-yellow-600/30" />
                                                                    </div>

                                                                    <div className="z-10 relative flex justify-between items-end">
                                                                        <div>
                                                                            <p className="text-[10px] text-white/80 uppercase tracking-wider font-medium mb-0.5">Limite Atual</p>
                                                                            <h3 className="text-2xl font-bold text-white drop-shadow-md">
                                                                                {acc.currency} {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                                            </h3>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[10px] text-white/60">Final</p>
                                                                            <p className="font-mono text-sm text-white/90 tracking-wider">
                                                                                •••• {acc.number ? acc.number.slice(-4) : "0000"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })
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
