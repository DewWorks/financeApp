"use client"

import { useTransactions } from "@/context/TransactionsContext"
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
import { OpenFinanceWidget } from "@/components/ui/molecules/OpenFinanceWidget"
import * as mongoose from "mongoose";
import { TransactionsProvider } from "@/context/TransactionsContext"
import { GoalsProvider } from "@/context/GoalsContext"

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

function DashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState<IUser | null>(null)

  const { currentProfileId, currentProfileName, isLoading: isProfileLoading } = useCurrentProfile();

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

  // OPTIMIZATION: Removed manual getTransactions() call on profile change. 
  // TransactionsProvider now watches `profileId` and updates automatically.

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
                  refreshTrigger={dataToUse}
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


          {/* Open Finance Widget - Collapsible & Optimized */}
          <OpenFinanceWidget />

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
                {/* Filtro por mês */}
                <div className="flex justify-center space-x-1 sm:space-x-2 my-3 sm:my-4 overflow-x-auto w-full">
                  <TimelineMonthSelector onSelectMonth={filterTransactionsByMonth} selectedMonth={selectedMonth} />
                </div>

                <TransactionsTable
                  transactions={transactions} // Context already handles filtering
                  onEditTransaction={handleEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onNextPage={handleNextPage}
                  onPreviousPage={handlePreviousPage}
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

function DashboardWrapper() {
  const { currentProfileId, isLoading } = useCurrentProfile()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background p-4 sm:p-8 flex items-center justify-center">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <TransactionsProvider profileId={currentProfileId}>
      <GoalsProvider>
        <DashboardContent />
      </GoalsProvider>
    </TransactionsProvider>
  )
}

export default function DashboardFinanceiro() {
  return <DashboardWrapper />
}
