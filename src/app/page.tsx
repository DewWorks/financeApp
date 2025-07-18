"use client"

import { useTransactions } from "@/hooks/useTransactions"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, LogIn, LogOut, User, Moon, Sun, ChevronLeft, ChevronRight, Search, RefreshCw } from "lucide-react"
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
import { ThemeProvider, useTheme } from "@/components/ui/organisms/ThemeContext"
import { ReportButton } from '@/components/ui/molecules/ReportButton'
import { useGoals } from "@/hooks/useGoals"
import SliderMonthSelector from "@/components/ui/molecules/SliderMonth"
import { ChartTypeSelector } from "@/components/ui/charts/ChartTypeSelection"
import { WhatsAppButton } from "@/components/ui/molecules/whatsapp-button"

const COLORS = ["#0088FE", "#ff6666", "#FFBB28", "#FF8042", "#8884D8"]

export default function DashboardFinanceiro() {
  const router = useRouter()
  const [user, setUser] = useState<IUser | null>(null)

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
    selectedMonth
  } = useTransactions()
  const { goals } = useGoals()

  const [selectedChartType, setSelectedChartType] = useState("pie")
  const dataToUse = isAllTransactions ? allTransactions : transactions;
  const totalIncome = Array.isArray(dataToUse)
      ? dataToUse.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
      : 0;

  const totalExpense = Array.isArray(dataToUse)
      ? dataToUse.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
      : 0;
  const balance = totalIncome - totalExpense

  function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <Button onClick={toggleTheme} variant="ghost" className="my-4 dark:text-white light:text-black">
          {theme === "light" ? <Moon className="h-5 w-5 sm:h-4 sm:h-4" /> : <Sun className="h-5 w-5" />}
        </Button>
    )
  }

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

  // const pieChartData = [
  //   { name: "Receitas", value: totalIncome },
  //   { name: "Despesas", value: totalExpense },
  // ]

  // const barChartData = Array.isArray(dataToUse)
  //     ? dataToUse.slice(0, 5).map((t) => ({
  //       name: t.description || "Sem descrição",
  //       valor: t.amount || 0,
  //       tipo: t.type === "income" ? "Receita" : "Despesa",
  //       tag: t.tag || "Sem tag",
  //     }))
  //     : [];

  // const lineChartData = Array.isArray(dataToUse)
  //     ? dataToUse.slice(0, 10).map((t) => ({
  //       data: t.date || "Sem data",
  //       valor: t.type === "income" ? t.amount || 0 : -(t.amount || 0),
  //       tag: t.tag || "Sem tag",
  //     }))
  //     : [];

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
      showProgress: true, // Mostra progresso "Step X of Y"
      allowClose: true, // Permite fechar o tutorial
      overlayOpacity: 0.6, // Deixa o fundo um pouco mais escuro
      allowKeyboardControl: true, // Permite navegar com o teclado
      doneBtnText: "Finalizar", // Texto do botão de finalizar
      nextBtnText: "Próximo", // Texto do botão de próximo
      prevBtnText: "Voltar", // Texto do botão de voltar
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
        element: "#transactions-values",
        popover: {
          title: "💰 Resumo Financeiro",
          description: "Aqui você pode ver o saldo total e o resumo das finanças.",
          onCloseClick: () => driverObj.destroy(),
        },
      },
      {
        element: "#add-transactions",
        popover: {
          title: "➕ Adicionar Transações",
          description: "Clique aqui para adicionar suas transações.",
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
          description: "Aqui estão todas as suas transações financeiras.",
        },
      },
      {
        element: "#transactions-chart",
        popover: {
          title: "📈 Gráficos Financeiros",
          description: "Esses gráficos mostram a sua situação financeira em detalhes.",
          onCloseClick: () => driverObj.destroy(),
          onNextClick: async () => {
            driverObj.destroy() // Finaliza o tutorial
            window.scrollTo({ top: 0, behavior: "smooth" }) // Retorna ao topo

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

            // Exibe alerta de sucesso
            Swal.fire({
              title: "🎉 Tutorial Concluído!",
              text: "Parabéns! Agora você pode começar no FinancePro!💸",
              icon: "success",
              confirmButtonText: "Começar já!",
              timer: 5000, // Fecha automaticamente após 5 segundos
              showConfirmButton: true,
            })
          },
        },
      },
    ])

    driverObj.drive()
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/auth/login")
  }

  const updateLocalTutorial = () => {
    localStorage.setItem("tutorial-guide", "true")
  }

  const handleAddIncome = (description: string, amount: number, tag: string, date: string, isRecurring: boolean,
                           recurrenceCount: number) => {
    const newTransaction: Partial<ITransaction> = {
      type: "income",
      description,
      amount,
      date,
      tag,
      isRecurring,
      recurrenceCount
    }
    addTransaction(newTransaction)
  }

  const handleAddExpense = (description: string, amount: number, tag: string, date: string, isRecurring: boolean,
                            recurrenceCount: number,) => {
    const newTransaction: Partial<ITransaction> = {
      type: "expense",
      description,
      amount,
      date,
      tag,
      isRecurring,
      recurrenceCount
    }
    addTransaction(newTransaction)
  }

  const handleEditTransaction = async (updatedTransaction: Partial<ITransaction>) => {
    await editTransaction(updatedTransaction)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    await deleteTransaction(transactionId)
  }

  const handleToggleTransactions = async () => {
    if (isAllTransactions) {
      // 🔹 Se já estiver mostrando todas, volta para a versão paginada do mês atual
      await getTransactions();
    } else {
      // 🔹 Se estiver mostrando a versão paginada do mês, busca todas
      await getAllTransactions(); // Carregar todas para gráficos
      await getAllTransactionsPage(1); // Buscar paginadas
    }

    setIsAllTransactions(!isAllTransactions); // Alternar estado
  };

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

  return (
      <ThemeProvider>
        <div className="min-h-screen light:bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
          <nav className="bg-white dark:bg-gray-800 shadow-md transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <Title />
                <ThemeToggle />
              </div>
              <div className="flex items-center">
                {user ? (
                    <motion.div
                        className="flex items-center space-x-3 px-3 py-2 rounded-lg shadow-sm cursor-pointer"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                      <motion.div
                          className="text-gray-700 dark:text-gray-300 font-semibold select-none cursor-default"
                          initial={{ rotate: -10 }}
                          animate={{ rotate: 0 }}
                          transition={{ duration: 0.3 }}
                      >
                        <User className="h-6 w-6 text-blue-600 cursor-default" />
                      </motion.div>
                      <motion.span
                          className="text-gray-700 dark:text-gray-300 font-semibold cursor-default"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        {user.name}
                      </motion.span>
                      <Button onClick={handleLogout} variant="ghost" className="text-gray-700 dark:text-gray-300">
                        <LogOut className="h-5 w-5 mr-2 text-red-500" />
                        Sair
                      </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                      <Button onClick={() => (window.location.href = "/auth/login")} variant="ghost">
                        <LogIn className="h-5 w-5 mr-2 text-green-600" />
                        Entrar
                      </Button>
                    </motion.div>
                )}
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-between items-center mb-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard Financeiro</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Visão geral das suas finanças pessoais</p>
              <WhatsAppButton/>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2" id="add-transactions">
                <AddIncomeDialog onAddIncome={handleAddIncome} />
                <AddExpenseDialog onAddExpense={handleAddExpense} />
                {user && <ReportButton user={user} transactions={dataToUse} goals={goals} />}
              </div>
            </motion.div>

            <motion.div
                id="transactions-values"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              <SummaryCard title="Saldo Total" value={balance} icon={DollarSign} description="Atualizado agora" />
              <SummaryCard
                  title="Receitas"
                  value={totalIncome}
                  icon={ArrowUpIcon}
                  valueColor="text-green-600"
                  description={`+${((totalIncome / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total`}
              />
              <SummaryCard
                  title="Despesas"
                  value={totalExpense}
                  icon={ArrowDownIcon}
                  valueColor="text-red-600"
                  description={`-${((totalExpense / (totalIncome + totalExpense)) * 100).toFixed(1)}% do total`}
              />
            </motion.div>

            <motion.div
                id="transactions-goals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-8"
            >
              <FinancialGoals transactions={dataToUse}/>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="bg-white dark:bg-gray-800 shadow-lg mb-8 transition-colors duration-200">
                <div className="w-full flex justify-between">
                <CardTitle id="transactions-table" className="text-lg font-semibold text-gray-900 dark:text-gray-100 p-4">
                  Tabela de Transações
                </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center sm:justify-start">
                    <Button
                        variant="default"
                        className={`transition-all m-2 ${
                            isAllTransactions ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                        }`}
                        onClick={handleToggleTransactions}
                    >
                      {isAllTransactions ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Limpar filtros
                          </>
                      ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Buscar Todas
                          </>
                      )}
                    </Button>
                  </div>
                </div>
                <CardContent>
                  {/* Paginação */}
                      <div className="flex justify-center items-center mt-4 space-x-4">
                        {/* Botão de Página Anterior */}
                        <Button
                            onClick={handlePreviousPage}
                            className="p-2 rounded-lg border dark:border-gray-600 bg-blue-600 text-white disabled:opacity-50"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>

                        {/* Indicador de Página Atual */}
                        <span className="text-md font-semibold dark:text-white">
                    Página {currentPage} de {totalPages}
                </span>

                        {/* Botão de Próxima Página */}
                        <Button
                            onClick={handleNextPage}
                            className="p-2 rounded-lg border dark:border-gray-600 disabled:opacity-50 bg-blue-600 text-white"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                  {/* Filtro por mês */}
                  <div className="flex justify-center space-x-2 my-4 overflow-x-auto">
                    <SliderMonthSelector onSelectMonth={filterTransactionsByMonth} />
                  </div>
                  {transactions.length > 0 ? (
                  <TransactionsTable
                      transactions={selectedMonth ? transactions : transactions}
                      onEditTransaction={handleEditTransaction}
                      onDeleteTransaction={handleDeleteTransaction}
                  />
                  ) : (
                      <Toast message={"Carregando transações"} type={"warning"} onClose={() => setToast(null)} />
                  )}
                  {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                </CardContent>
              </Card>
            </motion.div>
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="flex w-full justify-between items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Distribuição Financeira
                  <div className="gap-2 justify-center sm:justify-start">
                    <Button
                        variant="default"
                        className={`transition-all m-2 ${
                            isAllTransactions ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                        }`}
                        onClick={handleToggleTransactions}
                    >
                      {isAllTransactions ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Limpar filtros
                          </>
                      ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            Buscar Todas
                          </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
                <ChartTypeSelector selectedType={selectedChartType} onSelectType={setSelectedChartType} />
              </CardHeader>
              <CardContent>
                {selectedChartType === "pie" && <DistributionChart transactions={transactions} colors={COLORS} />}
                {selectedChartType === "bar" && <RecentTransactionsChart transactions={transactions} colors={COLORS} />}
                {selectedChartType === "line" && <CashFlowChart onFetchAllTransactions={handleToggleTransactions} transactions={transactions} colors={["#8884d8", "#ff3366"]} />}
                {selectedChartType === "area" && <IncomeVsExpensesChart onFetchAllTransactions={handleToggleTransactions} areaChartData={areaChartData} />}
              </CardContent>
            </Card>
          </main>
        </div>
      </ThemeProvider>
  )
}
