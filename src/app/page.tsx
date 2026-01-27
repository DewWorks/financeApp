"use client"

import { useTransactions } from "@/context/TransactionsContext"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, LogIn, LogOut, User, ChevronLeft, ChevronRight, Search, RefreshCw, TrendingUp, TrendingDown, Landmark, Wallet, Menu, Home, List, PieChart, Target, Plus, CircleDollarSign, LayoutList, LayoutGrid, Table, Calendar, Tag, ArrowRight, Edit, Trash2, ListFilter } from 'lucide-react'
import { AddIncomeDialog } from "@/components/ui/organisms/AddIncomeDialog"
import { AddExpenseDialog } from "@/components/ui/organisms/AddExpenseDialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/atoms/popover"
import type { ITransaction } from "@/interfaces/ITransaction"
import { SummaryCard } from "@/components/ui/molecules/SummaryCard"
import { TransactionsTable } from "@/components/ui/molecules/TransactionsTable"
import { TransactionListItem } from "@/components/ui/molecules/TransactionListItem"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select"
import { useRouter } from "next/navigation"
import { Title } from "@/components/ui/molecules/Title"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
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
import { UpsellBanner } from "@/components/ui/molecules/UpsellBanner"
import * as mongoose from "mongoose";
import { TransactionsProvider } from "@/context/TransactionsContext"
import { GoalsProvider } from "@/context/GoalsContext"
import { useTheme } from "@/components/ui/organisms/ThemeContext"

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
  const { theme, toggleTheme } = useTheme()

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
  const [activeTab, setActiveTab] = useState("home") // 'home' | 'transactions' | 'goals' | 'analytics'
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'table'>('list')
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all")
  const [selectedTag, setSelectedTag] = useState<string>("all")

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  // Get unique tags for filter
  const uniqueTags = Array.from(new Set(transactions.map(t => t.tag))).sort()

  const dataToUse = isAllTransactions ? allTransactions : transactions;

  // Search Logic
  useEffect(() => {
    if (searchTerm && allTransactions.length === 0) {
      getAllTransactions();
    }
  }, [searchTerm, allTransactions.length, getAllTransactions]);

  const filteredTransactions = allTransactions.filter(t => {
    const matchesSearch = debouncedSearchTerm
      ? t.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      t.tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      t.amount.toString().includes(debouncedSearchTerm)
      : true;

    const matchesType = selectedType === "all" ? true : t.type === selectedType;
    const matchesTag = selectedTag === "all" ? true : t.tag === selectedTag;

    return matchesSearch && matchesType && matchesTag;
  });

  // If no filters are active (search is empty, type is all, tag is all), show default transactions (paginated or all depending on logic)
  // However, the original logic was: if search, filter allTransactions. If not, use 'transactions' (which is paginated).
  // We need to maintain pagination if no search/filter.
  // Actually, if ANY filter is active, we should filter from 'allTransactions' and bypass server pagination (client-side filter).
  // If NO filter is active, we show 'transactions' which is the current page.

  const hasActiveFilters = debouncedSearchTerm !== "" || selectedType !== "all" || selectedTag !== "all";
  const displayTransactions = hasActiveFilters ? filteredTransactions : transactions;

  // Plan Check

  // Plan Check
  const isFree = !user?.subscription?.plan || user.subscription.plan === 'FREE';

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
                  body: JSON.stringify({ userId }),
                },
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
              <div className="flex-shrink-0 flex items-center">
                <Title size="md" />
              </div>

              {/* Profile Switcher - Align left next to logo */}
              <div className="hidden sm:flex flex-1 justify-start ml-4 sm:ml-8" id="profile-switcher">
                <ProfileSwitcher onProfileSwitch={handleProfileSwitch} userName={user?.name} userEmail={user?.email} />
              </div>

              {/* Área direita - User Info, Logout, Theme */}
              {/* Desktop Area - User Info, Logout, Theme */}
              <div className="hidden sm:flex items-center space-x-2">

                {/* Theme Toggle */}
                <ThemeToggle />

                {user && (
                  <>
                    {/* User Info */}
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
                      <span>Entrar</span>
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Mobile Menu - Hamburger */}
              <div className="flex sm:hidden items-center ml-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <Menu className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 max-w-[calc(100vw-1rem)] p-3 mr-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl" align="end">
                    <div className="flex flex-col gap-2">
                      {/* Mobile User Info Section */}
                      {user && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700 mb-2">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-800 flex-shrink-0">
                            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {user.name || "Usuário"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Theme Toggle Row */}
                      <div
                        className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => toggleTheme()}
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Alterar Tema</span>
                        <div className="pointer-events-none">
                          <ThemeToggle />
                        </div>
                      </div>

                      {user && (
                        <>
                          <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                          <Button
                            variant="ghost"
                            className="w-full justify-start px-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={handleProfile}
                          >
                            <User className="h-4 w-4 mr-2 text-blue-500" />
                            Perfil
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start px-3 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair
                          </Button>
                        </>
                      )}

                      {!user && (
                        <>
                          <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                          <Button
                            onClick={() => (window.location.href = "/auth/login")}
                            variant="ghost"
                            className="w-full justify-start px-3 text-green-600"
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Entrar
                          </Button>
                        </>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </nav >

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* --- MOBILE TABBED SECTIONS --- */}

          {/* SECTION: HOME */}
          <div className={activeTab === 'home' ? 'block min-h-[80vh] pb-32' : 'hidden md:block'}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              {/* Insight Widget */}
              <div className="w-full">
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



            <UpsellBanner />
            <OpenFinanceWidget />

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
          </div>

          {/* SECTION: GOALS */}
          <div className={activeTab === 'goals' ? 'block min-h-[80vh] pb-32' : 'hidden md:block'}>
            <motion.div
              id="transactions-goals"
              variants={itemVariants}
              className="mb-6 sm:mb-8"
            >
              <FinancialGoals transactions={dataToUse} />
            </motion.div>
          </div>

          {/* SECTION: TRANSACTIONS */}
          <div className={activeTab === 'transactions' ? 'block min-h-[80vh] pb-32' : 'hidden md:block'}>

            {/* Mobile-only Mini Summary for Transactions Tab */}
            <div className="md:hidden grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Saldo</span>
                <span className={`text-xs font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Receita</span>
                <span className="text-xs font-bold text-green-600">
                  R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Despesa</span>
                <span className="text-xs font-bold text-red-600">
                  R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

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

                  {/* Search and Filters Section */}
                  <div className="flex flex-col gap-3 mb-6 px-2">
                    {/* Top Row: Search + Filters */}
                    <div className="flex flex-col md:flex-row gap-2 w-full">
                      <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Buscar transação..."
                          className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 w-full"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1 text-gray-500 rounded-lg bg-gray-100 dark:bg-gray-800 px-2 py-2">
                          <ListFilter className="w-4 h-4" />
                          <span className="text-xs font-medium">Filtros</span>
                        </div>
                        <Select value={selectedType} onValueChange={(val: any) => setSelectedType(val)}>
                          <SelectTrigger className="w-[110px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-lg text-xs sm:text-sm">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="income">Receitas</SelectItem>
                            <SelectItem value="expense">Despesas</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={selectedTag} onValueChange={setSelectedTag}>
                          <SelectTrigger className="w-[120px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm rounded-lg text-xs sm:text-sm">
                            <SelectValue placeholder="Tag" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            {uniqueTags.map(tag => (
                              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Bottom Row: View Toggles */}
                    <div className="flex justify-start overflow-x-auto">
                      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-medium ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <LayoutList className="w-4 h-4" />
                          <span>Lista</span>
                        </button>
                        <button
                          onClick={() => setViewMode('card')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-medium ${viewMode === 'card' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                          <span>Cards</span>
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-medium ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <Table className="w-4 h-4" />
                          <span>Tabela</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* UNIFIED CONTENT RENDERING */}
                  <div>
                    {displayTransactions.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                        <Search className="w-12 h-12 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
                        <p>Nenhuma transação encontrada com os filtros atuais.</p>
                      </div>
                    ) : (
                      <>

                        {/* TABLE VIEW (Responsive + ForceScroll) */}
                        {viewMode === 'table' && (
                          <div className="overflow-x-auto pb-4">
                            <div className="md:w-full">
                              <TransactionsTable
                                transactions={displayTransactions}
                                onEditTransaction={handleEditTransaction}
                                onDeleteTransaction={handleDeleteTransaction}
                                currentPage={hasActiveFilters ? 1 : currentPage}
                                totalPages={hasActiveFilters ? 1 : totalPages}
                                onNextPage={hasActiveFilters ? () => { } : handleNextPage}
                                onPreviousPage={hasActiveFilters ? () => { } : handlePreviousPage}
                                forceDesktopMode={true}
                              />
                            </div>
                          </div>
                        )}

                        {viewMode === 'list' && (
                          <div className="max-w-4xl mx-auto flex flex-col rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                            {displayTransactions.map((t) => (
                              <TransactionListItem
                                key={t._id?.toString()}
                                transaction={t}
                                onEdit={() => handleEditTransaction(t)}
                                onDelete={() => handleDeleteTransaction(t._id!.toString())}
                              />
                            ))}
                          </div>
                        )}

                        {/* CARD VIEW (Grid Layout) */}
                        {viewMode === 'card' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                            {/* Hint for Swipe on Mobile */}
                            <div className="col-span-full md:hidden flex justify-center items-center gap-2 text-xs text-gray-400 mb-2">
                              <ArrowRight className="w-3 h-3" /> Arraste: Direita para Editar, Esquerda para Excluir
                            </div>
                            {displayTransactions.map((t) => (
                              <SwipeableTransactionCard
                                key={t._id?.toString()}
                                transaction={t}
                                theme={theme}
                                onEdit={() => handleEditTransaction(t)}
                                onDelete={() => handleDeleteTransaction(t._id!.toString())}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* SECTION: ANALYTICS */}
          <div className={activeTab === 'analytics' ? 'block min-h-[80vh] pb-32 flex flex-col' : 'hidden md:block'}>
            <motion.div
              variants={itemVariants}
              className="flex-1" // Ensure it takes available height
            >
              <Card className="bg-white dark:bg-gray-800 shadow-lg h-full flex flex-col" id="transactions-chart">
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

                  {/* Mobile-only Insights Filler */}
                  <div className="md:hidden mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      <PieChart className="w-4 h-4 text-blue-500" />
                      Análise Rápida
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Com base nos seus dados recentes, sua saúde financeira parece {balance >= 0 ? 'estável' : 'requerer atenção'}.
                      {totalIncome > totalExpense
                        ? ' Você está gastando menos do que ganha, ótimo trabalho! Continue mantendo seus gastos sob controle.'
                        : ' Seus gastos superaram seus ganhos neste período. Considere revisar suas categorias de despesa.'}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                        <span className="block text-[10px] text-gray-400">Maior Gasto</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {/* Simple logic for highest expense category could go here, strictly placeholder text for layout now */}
                          Variável
                        </span>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                        <span className="block text-[10px] text-gray-400">Economia</span>
                        <span className="text-xs font-medium text-green-600">
                          {((totalIncome - totalExpense) > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(0) : 0)}% da renda
                        </span>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>

        <div className="hidden md:block">
          <MobileTransactionFab
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
          />
        </div>

        {/* WhatsApp Button - Global & positioned right - FREE USERS ONLY */}
        {isFree && (
          <div className="fixed bottom-28 right-4 z-40 sm:bottom-8 sm:right-8">
            <WhatsAppButton />
          </div>
        )}

        {/* MOBILE BOTTOM NAVIGATION */}
        <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 px-6 py-3 z-50 flex items-center justify-between w-[95vw] max-w-sm">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'home' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
          >
            <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Início</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'transactions' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
          >
            <List className="w-6 h-6" strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Tabela</span>
          </button>

          {/* CENTRAL ADD BUTTON */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative -top-5">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 rounded-full"></div>
                <button
                  className="relative bg-gradient-to-tr from-blue-600 to-blue-500 text-white rounded-full p-4 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 active:scale-95 border-4 border-gray-50 dark:border-gray-900 flex items-center justify-center"
                >
                  <Plus className="w-7 h-7" strokeWidth={3} />
                </button>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2 mb-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-2xl rounded-xl" side="top" align="center" sideOffset={10}>
              <div className="flex flex-col gap-1">
                <div className="w-full">
                  <AddIncomeDialog onAddIncome={handleAddIncome} trigger={
                    <Button variant="ghost" className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
                      <ArrowUpIcon className="w-4 h-4 mr-2" /> Receita
                    </Button>
                  } />
                </div>
                <div className="h-px bg-gray-100 dark:bg-gray-700" />
                <div className="w-full">
                  <AddExpenseDialog onAddExpense={handleAddExpense} trigger={
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <ArrowDownIcon className="w-4 h-4 mr-2" /> Despesa
                    </Button>
                  } />
                </div>
              </div>
            </PopoverContent>
          </Popover>


          <button
            onClick={() => setActiveTab('goals')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'goals' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
          >
            <Target className="w-6 h-6" strokeWidth={activeTab === 'goals' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Metas</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}
          >
            <PieChart className="w-6 h-6" strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Análise</span>
          </button>
        </div>

      </motion.div >
    </>
  )
}

function SwipeableTransactionCard({ transaction, onEdit, onDelete, theme }: { transaction: ITransaction, onEdit: () => void, onDelete: () => void, theme: string }) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-100, -50], [1, 0]);
  const editOpacity = useTransform(x, [50, 100], [0, 1]);

  // Explicitly handle "white" vs "dark gray" based on theme, as 'bg-white' class is reliable only if not overridden by style
  const centerColor = theme === 'dark' ? "rgba(31, 41, 55, 1)" : "rgba(255, 255, 255, 1)";

  const cardColor = useTransform(x, [-150, -50, 0, 50, 150], [
    "rgba(239, 68, 68, 0.2)",
    "rgba(239, 68, 68, 0.1)",
    centerColor,
    "rgba(59, 130, 246, 0.1)",
    "rgba(59, 130, 246, 0.2)"
  ]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDelete();
    } else if (info.offset.x > 100) {
      onEdit();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        <motion.div style={{ opacity: editOpacity }} className="flex items-center text-blue-600 font-bold">
          <Edit className="w-6 h-6 mr-2" /> Editar
        </motion.div>
        <motion.div style={{ opacity: deleteOpacity }} className="flex items-center text-red-600 font-bold">
          Excluir <Trash2 className="w-6 h-6 ml-2" />
        </motion.div>
      </div>

      <motion.div
        style={{ x, backgroundColor: cardColor }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3 rounded-xl touch-pan-y"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {transaction.type === 'income' ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{transaction.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {transaction.tag}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-base font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.type === 'income' ? '+ ' : '- '}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" /> {new Date(transaction.date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 dark:border-gray-700">
          <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={onEdit}>
            <Edit className="w-3 h-3 mr-1" /> Editar
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete}>
            <Trash2 className="w-3 h-3 mr-1" /> Excluir
          </Button>
        </div>
      </motion.div>
    </div>
  );
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
