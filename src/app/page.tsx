"use client"

import { useTransactions } from "@/hooks/useTransactions"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, LogIn, LogOut, User, ChevronLeft, ChevronRight, Search, RefreshCw, TrendingUp, TrendingDown, Landmark, Wallet } from 'lucide-react'
import { AddIncomeDialog } from "@/components/ui/organisms/AddIncomeDialog"
import { AddExpenseDialog } from "@/components/ui/organisms/AddExpenseDialog"
import type { ITransaction } from "@/interfaces/ITransaction"
import { SummaryCard } from "@/components/ui/molecules/SummaryCard"
import { TransactionsTable } from "@/components/ui/molecules/TransactionsTable"
import { Button } from "@/components/ui/atoms/button"
import { useRouter } from "next/navigation"
import { Title } from "@/components/ui/molecules/Title"
import { motion } from "framer-motion"
import { CashFlowChart } from "@/components/ui/charts/CashFlowChart"
import { DistributionChart } from "@/components/ui/charts/DistributionChart"
import { RecentTransactionsChart } from "@/components/ui/charts/RecentTransactionChart"
import { IncomeVsExpensesChart } from "@/components/ui/charts/IncomeVsExpensesChart"
import { Toast } from "@/components/ui/atoms/toast"
import { FinancialGoals } from "@/components/ui/organisms/FinancialGoals"
import { useEffect, useState } from "react"
import Swal from "sweetalert2"
import type { IUser } from "@/interfaces/IUser"
import TimelineMonthSelector from "@/components/ui/molecules/TimelineMonth"
import { ChartTypeSelector } from "@/components/ui/charts/ChartTypeSelection"
import { WhatsAppButton } from "@/components/ui/molecules/whatsapp-button"
import { Tooltip } from "@/components/ui/atoms/tooltip"
import { ProfileSwitcher } from "@/components/ui/molecules/ProfileSwitcher"
import { useCurrentProfile } from "@/hooks/useCurrentProfile"
import { MobileTransactionFab } from "@/components/ui/molecules/MobileTransactionFab"
import { DashboardSkeleton } from "@/components/ui/atoms/DashboardSkeleton"
import { GlobalLoader } from "@/components/ui/molecules/GlobalLoader"
import { ThemeToggle } from "@/components/ui/atoms/ThemeToggle"
import { FinancialInsight } from "@/components/ui/molecules/FinancialInsight"
import * as mongoose from "mongoose";

const COLORS = ["#0088FE", "#ff6666", "#FFBB28", "#FF8042", "#8884D8"]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

export default function DashboardFinanceiro() {
  const router = useRouter()
  const [user, setUser] = useState<IUser | null>(null)
  const { currentProfileId, currentProfileName } = useCurrentProfile()

  const {
    transactions,
    allTransactions,
    getAllTransactions,
    getAllTransactionsPage,
    isAllTransactions,
    setIsAllTransactions,
    getTransactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    toast,
    setToast,
    currentPage,
    totalPages,
    handlePreviousPage,
    handleNextPage,
    filterTransactionsByMonth,
    selectedMonth,
    loading,
    summaryData,
    chartData
  } = useTransactions()

  const [selectedChartType, setSelectedChartType] = useState("pie")

  const dataToUse = isAllTransactions ? allTransactions : transactions;

  // Use backend data instead of frontend calculation
  const totalIncome = summaryData.income;
  const totalExpense = summaryData.expense;
  const balance = summaryData.balance;

  // --- OPEN FINANCE LOGIC ---
  const [bankConnections, setBankConnections] = useState<any[]>([])
  const [loadingConnections, setLoadingConnections] = useState(true)

  useEffect(() => {
    const fetchBankConnections = async () => {
      try {
        const response = await fetch('/api/bank-connections')
        if (response.ok) {
          const data = await response.json()
          setBankConnections(data)
        }
      } catch (error) {
        console.error("Erro ao buscar conexões bancárias:", error)
      } finally {
        setLoadingConnections(false)
      }
    }
    fetchBankConnections()
  }, [])

  const getBankDetails = (bankName: string) => {
    const name = bankName.toLowerCase();

    // Default Fallback
    const defaultDetails = { color: '#1e293b', logo: 'https://logo.clearbit.com/bank.com' };

    if (name.includes('nubank') || name.includes('nu pagamentos')) return { color: '#820ad1', logo: 'https://logo.clearbit.com/nubank.com.br' }; // Roxo Nubank
    if (name.includes('itaú') || name.includes('itau')) return { color: '#ec7000', logo: 'https://logo.clearbit.com/itau.com.br' };
    if (name.includes('bradesco')) return { color: '#cc092f', logo: 'https://logo.clearbit.com/bradesco.com.br' };
    if (name.includes('santander')) return { color: '#ec2028', logo: 'https://logo.clearbit.com/santander.com.br' };
    if (name.includes('inter')) return { color: '#ff7a00', logo: 'https://logo.clearbit.com/bancointer.com.br' };
    if (name.includes('brasil')) return { color: '#0038a8', logo: 'https://logo.clearbit.com/bb.com.br' }; // Azul BB
    if (name.includes('bb')) return { color: '#0038a8', logo: 'https://logo.clearbit.com/bb.com.br' }; // Azul BB
    if (name.includes('caixa')) return { color: '#0066b3', logo: 'https://logo.clearbit.com/caixa.gov.br' };
    if (name.includes('btg')) return { color: '#000000', logo: 'https://logo.clearbit.com/btgpactual.com' };
    if (name.includes('xp')) return { color: '#000000', logo: 'https://logo.clearbit.com/xpi.com.br' };
    if (name.includes('c6')) return { color: '#000000', logo: 'https://logo.clearbit.com/c6bank.com.br' };

    return defaultDetails;
  }

  // Separar contas com Filtro Estrito para não misturar Crédito no Saldo
  // E aplicar identidade visual da Conexão (Branding)
  const allAccounts = bankConnections.flatMap(conn => {
    const accounts = conn.accounts || [];
    if (accounts.length === 0) return [];

    // Tenta achar a identidade da conexão baseada em qualquer uma das contas
    const representativeAccount = accounts.find((acc: any) => {
      const name = (acc.name || '').toLowerCase();
      return name.includes('nubank') || name.includes('nu pagamentos') ||
        name.includes('itaú') || name.includes('itau') ||
        name.includes('bradesco') ||
        name.includes('santander') ||
        name.includes('inter') ||
        name.includes('brasil') ||
        name.includes('caixa') ||
        name.includes('btg') ||
        name.includes('xp') ||
        name.includes('c6');
    }) || accounts[0];

    const connectionBrand = representativeAccount ? getBankDetails(representativeAccount.name || '') : getBankDetails('');

    return accounts.map((acc: any) => ({
      ...acc,
      brand: connectionBrand
    }));
  });

  // Normalizar tipos para evitar problemas de case (Maiúsculo) e incluir BANK
  const checkingTypes = ['CHECKING_ACCOUNT', 'SAVINGS_ACCOUNT', 'PAYMENT_ACCOUNT', 'BANK'];

  // Saldo Disponível (Conta Corrente, Poupança, Pagamento, BANK)
  const checkingAccounts = allAccounts.filter((acc: any) =>
    acc.type && checkingTypes.includes(acc.type.toUpperCase())
  );

  // Cartões de Crédito (Explicitamente CREDIT_CARD ou CREDIT)
  const creditAccounts = allAccounts.filter((acc: any) =>
    acc.type && (acc.type.toUpperCase() === 'CREDIT_CARD' || acc.type.toUpperCase() === 'CREDIT')
  );

  // Outras contas (Investimentos, ou tipos desconhecidos)
  const otherAccounts = allAccounts.filter((acc: any) => {
    const type = acc.type ? acc.type.toUpperCase() : '';
    return !checkingTypes.includes(type) && type !== 'CREDIT_CARD' && type !== 'CREDIT';
  });

  const totalCheckingBalance = checkingAccounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem("user-id")
      if (!userId) {
        setUser(null)
        return
      }
      try {
        const response = await fetch(`/api/admin/users/${userId}`)
        if (!response.ok) {
          throw new Error("Usuário não encontrado")
        }
        const userData = await response.json()
        setUser(userData)
      } catch (error) {
        console.error("Erro ao buscar usuário:", error)
        setUser(null)
      }
    }
    fetchUser()
  }, [])

  // Atualizar transações quando o profile mudar
  useEffect(() => {
    if (currentProfileId !== undefined) {
      getTransactions()
    }
  }, [currentProfileId])

  const areaChartData = Array.isArray(dataToUse)
    ? dataToUse.slice(0, 15).map((t) => ({
      data: t.date || "Sem data",
      receita: t.type === "income" ? t.amount || 0 : 0,
      despesa: t.type === "expense" ? t.amount || 0 : 0,
    }))
    : [];

  const [runTutorial, setRunTutorial] = useState(false)

  const getUserIdLocal = () => {
    const userId = localStorage.getItem("user-id")
    return userId
  }

  // Verificar se o tutorial já foi visto
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("tutorial-guide")
    if (!runTutorial && hasSeenTutorial === "false") {
      setRunTutorial(true)
    }
  }, [])

  // Inicia o tutorial quando runTutorial for true
  useEffect(() => {
    if (runTutorial) {
      startTutorial()
    }
  }, [runTutorial])

  // Função para iniciar o tutorial
  const startTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.6,
      allowKeyboardControl: true,
      doneBtnText: "Finalizar",
      nextBtnText: "Próximo",
      prevBtnText: "Voltar",
      onDestroyStarted: () => {
        localStorage.setItem("tutorial-guide", "true")
      },
      popoverClass: "custom-popover",
    })

    driverObj.setSteps([
      {
        popover: {
          title: "🚀 Bem-vindo ao FinancePro!",
          description: "Vamos te guiar pelos principais recursos do sistema para que você aproveite ao máximo!",
          showButtons: ["next"],
        },
      },
      {
        element: "#profile-switcher",
        popover: {
          title: "👥 Contas e Perfis",
          description: "Aqui você pode trocar entre sua conta pessoal e contas colaborativas. Crie contas compartilhadas para gerenciar finanças em grupo!",
        },
      },
      {
        element: "#transactions-values",
        popover: {
          title: "💰 Resumo Financeiro",
          description: "Aqui você pode ver o saldo total e o resumo das finanças da conta atual.",
        },
      },
      {
        element: "#add-transactions",
        popover: {
          title: "➕ Adicionar Transações",
          description: "Clique aqui para adicionar suas transações à conta atual.",
        },
      },
      {
        element: "#transactions-goals",
        popover: {
          title: "🎯 Metas Financeiras",
          description: "Aqui estão todas as suas metas financeiras.",
        },
      },
      {
        element: "#transactions-table",
        popover: {
          title: "📊 Histórico de Transações",
          description: "Aqui estão todas as transações da conta atual.",
        },
      },
      {
        element: "#transactions-chart",
        popover: {
          title: "📈 Gráficos Financeiros",
          description: "Esses gráficos mostram a situação financeira da conta atual em detalhes.",
          onCloseClick: () => driverObj.destroy(),
          onNextClick: async () => {
            driverObj.destroy()
            window.scrollTo({ top: 0, behavior: "smooth" })
            const userId = getUserIdLocal()
            try {
              await fetch("/api/admin/users/tutorialFinished", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
              })
            } catch (error) {
              console.error("Failed to update tutorial status:", error)
            }
            setRunTutorial(false)
            updateLocalTutorial()
            Swal.fire({
              title: "🎉 Tutorial Concluído!",
              text: "Parabéns! Agora você pode começar no FinancePro!💸",
              icon: "success",
              confirmButtonText: "Começar já!",
              timer: 5000,
              showConfirmButton: true,
            })
          },
        },
      },
    ])
    driverObj.drive()
  }

  const handleLogout = () => {
    Swal.fire({
      title: "Tem certeza que deseja sair?",
      text: "Você precisará fazer login novamente para acessar sua conta.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, sair",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("token")
        localStorage.removeItem("current-profile-id")
        localStorage.removeItem("current-profile-name")
        router.push("/auth/login")
      }
    })
  }

  const updateLocalTutorial = () => {
    localStorage.setItem("tutorial-guide", "true")
  }

  const handleAddIncome = (description: string, amount: number, tag: string, date: string, isRecurring: boolean, recurrenceCount: number) => {
    const newTransaction: Partial<ITransaction> = {
      type: "income",
      description,
      amount,
      date,
      tag,
      isRecurring,
      recurrenceCount,
      profileId: currentProfileId ? new mongoose.Types.ObjectId(currentProfileId) : undefined
    }
    addTransaction(newTransaction)
  }

  const handleAddExpense = (description: string, amount: number, tag: string, date: string, isRecurring: boolean, recurrenceCount: number) => {
    const newTransaction: Partial<ITransaction> = {
      type: "expense",
      description,
      amount,
      date,
      tag,
      isRecurring,
      recurrenceCount,
      profileId: currentProfileId ? new mongoose.Types.ObjectId(currentProfileId) : undefined
    }
    addTransaction(newTransaction)
  }

  const handleEditTransaction = async (updatedTransaction: Partial<ITransaction>) => {
    await editTransaction(updatedTransaction)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    await deleteTransaction(transactionId)
  }

  const [isLoadingAll, setIsLoadingAll] = useState(false)

  const handleToggleTransactions = async (): Promise<boolean> => {
    if (isAllTransactions) {
      setIsLoadingAll(true); // Show loader even for reset if needed, or maybe just for 'ALL'
      await getTransactions();
      setIsAllTransactions(false);
      setIsLoadingAll(false);
      return true;
    } else {
      const result = await Swal.fire({
        title: 'Carregar todo o histórico?',
        text: "Essa ação irá buscar todas as suas transações desde o início. Isso permite visualizações completas e comparativos.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Sim, carregar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        setIsLoadingAll(true);
        // Minimum visualization time for the premium loader (because it's cool)
        await Promise.all([
          getAllTransactions(),
          getAllTransactionsPage(1),
          new Promise(resolve => setTimeout(resolve, 3000)) // Force at least 3s of loading
        ]);

        setIsAllTransactions(true);
        setIsLoadingAll(false);
        return true;
      }
      return false;
    }
  };

  const handleProfile = () => {
    router.push('/profile')
  }

  const handleProfileSwitch = (profileId: string | null) => {
    // O ProfileSwitcher já gerencia o localStorage e reload
    // Aqui podemos adicionar lógica adicional se necessário
    console.log({ profileId })
  }

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      Swal.fire({
        title: "Autenticação necessária",
        html: `
          <div class="flex flex-col items-center">
            <h2 class="text-lg font-semibold">Faça login para continuar</h2>
            <button class="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick="window.location.href = '/auth/login'">
              Fazer Login
            </button>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          popup: "p-4 bg-white rounded-lg shadow-md",
          title: "text-lg font-semibold",
          htmlContainer: "flex flex-col items-center",
        },
      })
    }
  }, [])

  if (loading && !isLoadingAll) { // Only show skeleton if NOT global loading (or should we show both underneath?)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background p-4 sm:p-8">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <>
      {isLoadingAll && <GlobalLoader />} {/* Premium Loader Overlay */}
      <motion.div
        className="min-h-screen bg-gray-50 dark:bg-background"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="hidden sm:flex-shrink-0 sm:block">
                <Title size="md" />
              </div>

              {/* Profile Switcher - Centro no mobile */}
              <div className="flex-1 flex justify-center sm:justify-start sm:ml-8" id="profile-switcher">
                <ProfileSwitcher onProfileSwitch={handleProfileSwitch} />
              </div>

              {/* Área direita - User Info, Logout, Theme */}
              <div className="flex items-center space-x-2">

                {/* Theme Toggle - NEW */}
                <ThemeToggle />

                {user && (
                  <>
                    {/* User Info - apenas ícone no mobile */}
                    <Tooltip title={'Perfil'} arrow>
                      <Button
                        className="p-2 rounded-lg bg-transparent transition-colors hover:bg-blue-100 dark:hover:bg-gray-700"
                        onClick={handleProfile}
                      >
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </Button>
                    </Tooltip>

                    {/* Logout */}
                    <Tooltip title="Sair" arrow>
                      <Button
                        onClick={handleLogout}
                        className="p-2 rounded-lg bg-transparent transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      >
                        <LogOut className="h-5 w-5" />
                      </Button>
                    </Tooltip>
                  </>
                )}

                {!user && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button onClick={() => (window.location.href = "/auth/login")} variant="ghost" size="sm">
                      <LogIn className="h-5 w-5 mr-2 text-green-600" />
                      <span className="hidden sm:inline">Entrar</span>
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </nav >

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            variants={itemVariants}
            className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8"
          >
            {/* Left Column: Title & Insight Widget */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Title Section */}
              <div className="flex-shrink-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {currentProfileId ? `${currentProfileName}` : "Visão Geral"}
                </p>
              </div>

              {/* Insight Widget - Takes available space */}
              <div className="w-full md:max-w-md lg:max-w-lg">
                <FinancialInsight
                  userRequestName={user?.name}
                  profileId={currentProfileId || undefined}
                  loading={loading}
                  compact={false}
                  refreshTrigger={dataToUse.length}
                  scope={isAllTransactions ? 'all' : 'recent'}
                />
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="hidden sm:flex flex-row gap-3 w-full lg:w-auto" id="add-transactions">
              <div className="flex-1 lg:flex-none">
                <AddIncomeDialog onAddIncome={handleAddIncome} />
              </div>
              <div className="flex-1 lg:flex-none">
                <AddExpenseDialog onAddExpense={handleAddExpense} />
              </div>
            </div>
          </motion.div>

          <div className="fixed bottom-4 left-4 z-40 sm:bottom-8 sm:right-8 sm:left-auto">
            <WhatsAppButton />
          </div>


          {/* Conditional Open Finance Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex justify-between items-end mb-4 px-1">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  Minhas Contas & Cartões
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Visão geral integrada</p>
              </div>
              {bankConnections.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/bank')}
                  className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-800"
                >
                  Gerenciar
                </Button>
              )}
            </div>

            {loadingConnections ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </div>
            ) : bankConnections.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

                {/* Left Column: Checking Accounts & Balance */}
                <div className="flex flex-col gap-6">
                  {checkingAccounts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                        Saldo Disponível
                      </h3>
                      <div className="flex flex-col gap-4">
                        {/* Card Único de Saldo Consolidado com Detalhes */}
                        <div className="rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between min-h-[160px]">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-xl">
                                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Saldo Consolidado</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                                  R$ {totalCheckingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </h3>
                              </div>
                            </div>
                          </div>

                          {/* Lista das contas dentro do card */}
                          <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1">
                            <div className="flex flex-col gap-2">
                              {checkingAccounts.map((acc: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm group">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.brand.color }}></div>
                                    <span className="text-gray-600 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                      {acc.name}
                                    </span>
                                  </div>
                                  <span className="text-gray-900 dark:text-gray-100 font-semibold opacity-90">
                                    {acc.currency} {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Credit Cards */}
                <div className="flex flex-col gap-6">
                  {creditAccounts.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                        Cartões de Crédito
                      </h3>
                      <div className="flex overflow-x-auto pb-4 gap-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x">
                        {creditAccounts.map((acc: any, idx: number) => (
                          <div key={`${acc.accountId}-${idx}`}
                            className="min-w-[300px] w-full h-52 rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl snap-center relative overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl"
                            style={{ background: acc.brand.color }}
                          >
                            {/* Texture/Pattern */}
                            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute left-0 bottom-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                            {/* Header: Logo & Chip */}
                            <div className="flex justify-between items-start z-10 relative">
                              <div className="flex items-center gap-3">
                                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                  <img
                                    src={acc.brand.logo}
                                    alt={acc.name}
                                    className="h-6 w-6 object-contain"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<svg class="w-6 h-6 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21l18 0" /><path d="M3 10l18 0" /><path d="M5 6l7 -3l7 3" /><path d="M4 10l0 11" /><path d="M20 10l0 11" /><path d="M8 14l0 3" /><path d="M12 14l0 3" /><path d="M16 14l0 3" /></svg>' }}
                                  />
                                </div>
                                <span className="font-bold text-lg tracking-wide text-white/90 drop-shadow-md whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">{acc.name}</span>
                              </div>
                              <div className="w-10 h-8 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md opacity-80 border border-yellow-300/50" />
                            </div>

                            {/* Middle: Number Mask */}
                            <div className="z-10 mt-4 relative">
                              <p className="font-mono text-lg tracking-[0.2em] text-white/80 drop-shadow-sm">
                                •••• •••• •••• {acc.number ? acc.number.slice(-4) : '0000'}
                              </p>
                            </div>

                            {/* Footer: Balance & Label */}
                            <div className="z-10 relative flex justify-between items-end mt-2">
                              <div>
                                <p className="text-[10px] text-white/70 uppercase tracking-widest font-semibold mb-0.5">Fatura Atual</p>
                                <h3 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                                  {acc.currency} {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </h3>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Limit</span>
                                <span className="text-xs font-mono text-white/90">------</span>
                              </div>
                            </div>
                          </div>

                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Outras Contas (Fallback) */}
                {otherAccounts.length > 0 && (
                  <div className="col-span-1 xl:col-span-2 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                      Outras Contas ({otherAccounts.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {otherAccounts.map((acc: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{acc.name}</span>
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">{acc.type}</span>
                          </div>
                          <div className="mt-2">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                              {acc.currency} {acc.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback Total */}
                {checkingAccounts.length === 0 && creditAccounts.length === 0 && otherAccounts.length === 0 && (
                  <div className="col-span-1 xl:col-span-2 p-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700 rounded-xl">
                    <h3 className="text-yellow-800 dark:text-yellow-200 font-bold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Conexão Ativa, mas nenhuma conta identificada.
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Recebemos {allAccounts.length} contas do banco, mas não conseguimos categorizá-las.
                      <br />Tipos encontrados: {allAccounts.map(a => a.type).join(', ') || 'Nenhum tipo definido'}
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none shadow-lg">
                <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Landmark className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Open Finance</h3>
                      <p className="text-blue-100">Conecte seu banco e sincronize extratos automaticamente.</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto font-semibold shadow-md whitespace-nowrap"
                    onClick={() => router.push('/bank')}
                  >
                    Conectar Agora
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Summary Cards - responsivo */}
          <motion.div
            id="transactions-values"
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
          >
            <SummaryCard
              title="Saldo Total"
              value={balance}
              icon={balance >= 0 ? TrendingUp : TrendingDown}
              description={balance >= 0 ? "Saldo Positivo" : "Saldo Negativo"}
              variant={balance >= 0 ? "success" : "danger"}
            />
            <SummaryCard
              title="Receitas"
              value={totalIncome}
              icon={ArrowUpIcon}
              variant="success"
              description={`+${((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total`}
            />
            <SummaryCard
              title="Despesas"
              value={totalExpense}
              icon={ArrowDownIcon}
              variant="danger"
              description={`-${((totalExpense / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total`}
            />
          </motion.div>

          {/* Goals */}
          <motion.div
            id="transactions-goals"
            variants={itemVariants}
            className="mb-6 sm:mb-8"
          >
            <FinancialGoals transactions={dataToUse} />
          </motion.div>

          {/* Transactions Table */}
          <motion.div
            variants={itemVariants}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-lg mb-6 sm:mb-8 transition-colors duration-200">
              <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-0">
                <CardTitle
                  id="transactions-table"
                  className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 sm:p-4 mb-2 sm:mb-0"
                >
                  Tabela de Transações
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                  <Button
                    variant="default"
                    size="sm"
                    className={`transition-all sm:m-2 ${isAllTransactions ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                      }`}
                    onClick={handleToggleTransactions}
                  >
                    {isAllTransactions ? (
                      <>
                        <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">Limpar</span>
                      </>
                    ) : (
                      <>
                        <Search className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">Buscar Todas</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <CardContent className="p-3 sm:p-6">
                {/* Paginação - compacta no mobile */}
                <div className="flex justify-center items-center mt-2 sm:mt-4 space-x-2 sm:space-x-4">
                  <Button
                    onClick={handlePreviousPage}
                    size="sm"
                    className="p-1 sm:p-2 rounded-lg border dark:border-gray-600 bg-blue-600 text-white disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 w-5" />
                  </Button>
                  <span className="text-xs sm:text-md font-semibold dark:text-white px-2">
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    onClick={handleNextPage}
                    size="sm"
                    className="p-1 sm:p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50 bg-blue-600 text-white"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 w-5" />
                  </Button>
                </div>
                {/* Filtro por mês */}
                <div className="flex justify-center space-x-1 sm:space-x-2 my-3 sm:my-4 overflow-x-auto w-full">
                  <TimelineMonthSelector onSelectMonth={filterTransactionsByMonth} selectedMonth={selectedMonth} />
                </div>

                <TransactionsTable
                  transactions={selectedMonth ? transactions : transactions}
                  onEditTransaction={handleEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />

                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts */}
          <motion.div
            variants={itemVariants}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-lg" id="transactions-chart">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 space-y-2 sm:space-y-0">
                  <span>Distribuição Financeira</span>
                  <div className="gap-2 justify-center sm:justify-start">
                    <Button
                      variant="default"
                      size="sm"
                      className={`transition-all ${isAllTransactions ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                        }`}
                      onClick={handleToggleTransactions}
                    >
                      {isAllTransactions ? (
                        <>
                          <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Limpar</span>
                        </>
                      ) : (
                        <>
                          <Search className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">Buscar Todas</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
                <ChartTypeSelector selectedType={selectedChartType} onSelectType={setSelectedChartType} />
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {selectedChartType === "pie" && <DistributionChart transactions={chartData.length > 0 ? chartData : transactions} colors={COLORS} />}
                {selectedChartType === "bar" && <RecentTransactionsChart transactions={chartData.length > 0 ? chartData : transactions} colors={COLORS} />}
                {selectedChartType === "line" && (
                  <CashFlowChart
                    onFetchAllTransactions={handleToggleTransactions}
                    transactions={chartData.length > 0 ? chartData : transactions}
                    colors={["#8884d8", "#ff3366"]}
                  />
                )}
                {selectedChartType === "area" && (
                  <IncomeVsExpensesChart
                    onFetchAllTransactions={handleToggleTransactions}
                    transactions={chartData.length > 0 ? chartData : transactions}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>

        <MobileTransactionFab
          onAddIncome={handleAddIncome}
          onAddExpense={handleAddExpense}
        />
      </motion.div>
    </>
  )
}
