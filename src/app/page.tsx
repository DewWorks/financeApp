"use client"

import { useTransactions } from "@/context/TransactionsContext"
import { useTheme } from "@/components/ui/organisms/ThemeContext"
import { useUser } from "@/context/UserContext"
import { useCurrentProfile } from "@/hooks/useCurrentProfile"
import { useDashboardFilters } from "@/hooks/useDashboardFilters"
import { useTransactionActions } from "@/hooks/useTransactionActions"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useDashboardTutorial } from "@/hooks/useDashboardTutorial"

import { DashboardHeader } from "@/components/ui/organisms/DashboardHeader"
import { DashboardSummary } from "@/components/ui/organisms/DashboardSummary"
import { DashboardGoals } from "@/components/ui/organisms/DashboardGoals"
import { DashboardTransactions } from "@/components/ui/organisms/DashboardTransactions"
import { MobileBottomNav } from "@/components/ui/organisms/MobileBottomNav"

import { DashboardSkeleton } from "@/components/ui/atoms/DashboardSkeleton"
import { GlobalLoader } from "@/components/ui/molecules/GlobalLoader"
import { UpsellBanner } from "@/components/ui/molecules/UpsellBanner"
import { OpenFinanceWidget } from "@/components/ui/molecules/OpenFinanceWidget"
import { WhatsAppButton } from "@/components/ui/molecules/whatsapp-button"
import { MobileTransactionFab } from "@/components/ui/molecules/MobileTransactionFab"
import { AddIncomeDialog } from "@/components/ui/organisms/AddIncomeDialog"
import { AddExpenseDialog } from "@/components/ui/organisms/AddExpenseDialog"
import { Toast } from "@/components/ui/atoms/toast"
import { MfaNudge } from "@/components/dashboard/MfaNudge"

// Charts (Analytics Section)
import { CashFlowChart } from "@/components/ui/charts/CashFlowChart"
import { DistributionChart } from "@/components/ui/charts/DistributionChart"
import { RecentTransactionsChart } from "@/components/ui/charts/RecentTransactionChart"
import { IncomeVsExpensesChart } from "@/components/ui/charts/IncomeVsExpensesChart"
import { ChartTypeSelector } from "@/components/ui/charts/ChartTypeSelection"
import { Card, CardContent, CardTitle } from "@/components/ui/atoms/card"
import { PieChart, TrendingUp, TrendingDown } from "lucide-react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { IUser, PlanType } from "@/interfaces/IUser"
import { ObjectId } from "mongodb"
import { TransactionsProvider } from "@/context/TransactionsContext"
import { GoalsProvider } from "@/context/GoalsContext"
import { ITransaction } from "@/interfaces/ITransaction"

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
  const { theme, toggleTheme } = useTheme()

  // Context Data
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
    currentPage,
    totalPages,
    handlePreviousPage,
    handleNextPage,
    filterTransactionsByMonth,
    selectedMonth,
    loading,
    summaryData,
    chartData,
    setTransactions,
    setAllTransactions,
    getChartData,
    getSummary,
    toast,
    setToast
  } = useTransactions()

  const { currentProfileId, isLoading: isProfileLoading } = useCurrentProfile();

  // Context Data from UserContext (Global Source of Truth)
  // Replaces local fetch to ensure Admin logic (currentPlan) is respected everywhere
  const { user, currentPlan, loading: isUserLoading } = useUser();

  const [activeTab, setActiveTab] = useState("home")
  const [selectedChartType, setSelectedChartType] = useState("pie")

  // Custom Hooks
  const filters = useDashboardFilters({
    allTransactions,
    getAllTransactions
  })

  // Destructure setters needed for Tutorial
  const { setViewMode } = filters

  const transactionActions = useTransactionActions({
    setTransactions,
    setAllTransactions,
    editTransaction,
    deleteTransaction,
    getChartData,
    getSummary
  })

  const { dataToUse, uniqueTags } = useDashboardData(chartData, transactions)

  // Tutorial Hook
  useDashboardTutorial({ setActiveTab, setViewMode, userRequestName: user?.name })

  // Derived Values
  const [displayBalance, setDisplayBalance] = useState(0);
  const [displayIncome, setDisplayIncome] = useState(0);
  const [displayExpense, setDisplayExpense] = useState(0);

  // Effect to update summary values based on profile/month
  useEffect(() => {
    if (summaryData) {
      setDisplayBalance(summaryData.balance);
      setDisplayIncome(summaryData.income);
      setDisplayExpense(summaryData.expense);
    }
  }, [summaryData]);

  // Derived Props for Sub-Components
  const isFree = currentPlan === PlanType.FREE;
  // const isAdmin = user?.admin || false; // No longer needed manually, hidden in currentPlan logic

  // Toggle Logic
  const handleToggleTransactions = async (): Promise<boolean> => {
    if (isAllTransactions) {
      filters.setIsTableLoading(true);
      await getTransactions();
      setIsAllTransactions(false);
      filters.setIsTableLoading(false);
      return true;
    } else {
      // Simple confirm logic handled in component? 
      // Original page.tsx had Swal. 
      // We can keep it simple or recreate Swal here.
      // For brevity, I'll assume we can just toggle or import Swal.
      // Let's import Swal to maintain feature parity.
      const Swal = (await import("sweetalert2")).default;
      const result = await Swal.fire({
        title: 'Carregar todo o histórico?',
        text: "Busca completa de transações.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Sim',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        filters.setIsTableLoading(true);
        await Promise.all([
          getAllTransactions(),
          getAllTransactionsPage(1)
        ]);
        setIsAllTransactions(true);
        filters.setIsTableLoading(false);
        return true;
      }
      return false;
    }
  };

  // Handlers for Add Dialogs (Delegated to Context/Hooks)
  const handleAddIncome = async (d: string, a: number, t: string, date: string, r: boolean, rc: number) => {
    await addTransaction({
      type: 'income',
      description: d,
      amount: a,
      tag: t,
      date: new Date(date).toISOString(),
      isRecurring: r,
      recurrenceCount: rc,
      profileId: (currentProfileId || undefined) as unknown as ObjectId
    })
  }

  const handleAddExpense = async (d: string, a: number, t: string, date: string, r: boolean, rc: number) => {
    await addTransaction({
      type: 'expense',
      description: d,
      amount: a,
      tag: t,
      date: new Date(date).toISOString(),
      isRecurring: r,
      recurrenceCount: rc,
      profileId: (currentProfileId || undefined) as unknown as ObjectId
    })
  }
  // This usually needs to interact with ProfileContext, but ProfileSwitcher handles it internally?
  // Check original page.tsx: <ProfileSwitcher onProfileSwitch={handleProfileSwitch} ... />
  const handleProfileSwitch = (id: string | null) => {
    window.location.reload();
  }

  // Edit Logic
  const [editingTransaction, setEditingTransaction] = useState<ITransaction | null>(null)

  const handleSaveEdit = async (d: string, a: number, t: string, date: string, r: boolean, rc: number) => {
    if (!editingTransaction?._id) return

    try {
      // Force ID to string to ensure correct URL in axios
      const idString = editingTransaction._id.toString();

      await editTransaction({
        _id: idString as any, // Cast to avoid TS error, ensuring runtime string
        description: d,
        amount: a,
        tag: t,
        date: new Date(date).toISOString(),
        isRecurring: r,
        recurrenceCount: rc,
        type: editingTransaction.type
      })
      setToast({ message: "Transação salva com sucesso!", type: 'success' });
    } catch (e) {
      console.error("Falha ao salvar edição:", e);
      setToast({ message: "Erro ao salvar edição.", type: 'error' });
    }
  }

  // Loading State
  // Ensure we don't flash "Logged Out" state while verifying auth
  if ((loading && !isAllTransactions && transactions.length === 0 && allTransactions.length === 0) || isUserLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background p-4 sm:p-8">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <>
      {isAllTransactions && <GlobalLoader />} {/* Show if loading ALL history specifically */}

      <motion.div
        className="min-h-screen bg-gray-50 dark:bg-background"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <DashboardHeader
          user={user}
          handleLogout={() => {
            fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/auth/login');
          }}
          handleProfileSwitch={handleProfileSwitch}
          handleProfile={() => router.push('/profile')}
          toggleTheme={toggleTheme}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* SECURITY NUDGE */}
          <MfaNudge mfaEnabled={user?.mfaEnabled} />

          {/* SECTION: HOME */}
          <div className={activeTab === 'home' ? 'block min-h-[80vh] pb-32 md:min-h-0 md:pb-0' : 'hidden md:block'}>
            <DashboardSummary
              balance={displayBalance}
              totalIncome={displayIncome}
              totalExpense={displayExpense}
              userRequestName={user?.name}
              profileId={currentProfileId || undefined}
              loading={loading}
              isAllTransactions={isAllTransactions}
              refreshTrigger={dataToUse}
            />
            <div className="mb-8">
              <OpenFinanceWidget />
            </div>
          </div>

          {/* SECTION: GOALS */}
          {/* Mobile Tab Logic: ONLY show if activeTab is 'goals'. Desktop: Always show block?
                Original logic: <div className={activeTab === 'goals' ? 'block ...' : 'hidden md:block'}>
                It means on Desktop, All sections are visible vertically stacked?
                Yes, original dashboard was single page scroll on desktop.
            */}
          <div className={activeTab === 'goals' ? 'block min-h-[80vh] pb-32 md:min-h-0 md:pb-0' : 'hidden md:block'}>
            <DashboardGoals transactions={dataToUse} />
          </div>

          {/* SECTION: TRANSACTIONS */}
          <div className={activeTab === 'transactions' ? 'block min-h-[80vh] pb-32 md:min-h-0 md:pb-0' : 'hidden md:block'}>
            {/* Mobile-only Mini Summary for Transactions Tab - We missed this in organisms
                     I will quickly inline it or omit. It's nice to have.
                     I'll replicate simpler version or skip to keep code clean.
                     The user liked it. I should keep it. 
                     I'll add it to DashboardTransactions Organism? 
                     No, pass it as children? 
                     I'll put it here.
                 */}
            <div className="md:hidden grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Saldo</span>
                <span className={`text-xs font-bold ${displayBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  R$ {displayBalance.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Receita</span>
                <span className="text-xs font-bold text-green-600">
                  R$ {displayIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Despesa</span>
                <span className="text-xs font-bold text-red-600">
                  R$ {displayExpense.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
            <DashboardTransactions
              transactions={filters.isFiltering ? filters.filteredTransactions : transactions}
              filters={filters}
              onEdit={(t) => setEditingTransaction(t)}
              onDelete={transactionActions.handleDeleteTransaction}
              pagination={{
                currentPage,
                totalPages,
                onNextPage: handleNextPage,
                onPreviousPage: handlePreviousPage
              }}
              monthSelector={{
                selectedMonth,
                onSelectMonth: filterTransactionsByMonth
              }}
              onToggleAll={handleToggleTransactions}
              isAllTransactions={isAllTransactions}
              uniqueTags={uniqueTags}
              loading={loading}
              isTableLoading={filters.isTableLoading}
            />
          </div>

          {/* SECTION: ANALYTICS (Legacy Charts kept here for now) */}
          <div className={activeTab === 'analytics' ? 'block min-h-[80vh] pb-32 md:min-h-0 md:pb-0' : 'hidden md:block'}>
            <motion.div id="transactions-chart" variants={itemVariants}>
              <Card className="bg-white dark:bg-gray-800 shadow-lg mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-center sm:p-2 border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 p-4">
                    Análise Financeira
                  </CardTitle>
                  <ChartTypeSelector selectedType={selectedChartType} onSelectType={setSelectedChartType} />
                </div>
                <CardContent className="p-4 sm:p-6 min-h-[300px] h-auto">
                  {/* Chart Switch Logic */}
                  {dataToUse.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
                      <p>Sem dados para exibir gráficos</p>
                    </div>
                  ) : (
                    <>
                      {selectedChartType === "pie" && <DistributionChart transactions={dataToUse} colors={COLORS} />}
                      {selectedChartType === "bar" && <CashFlowChart transactions={dataToUse} initialChartType="comparativoAnual" />}
                      {selectedChartType === "line" && <CashFlowChart transactions={dataToUse} initialChartType="fluxoDiario" />}
                      {selectedChartType === "list" && <RecentTransactionsChart transactions={dataToUse} colors={COLORS} />}
                      {selectedChartType === "area" && (
                        <IncomeVsExpensesChart
                          onFetchAllTransactions={handleToggleTransactions}
                          transactions={dataToUse}
                          initialChartType="acumulado"
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Financial Highlights Section */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Maior Despesa</p>
                <p className="text-lg font-bold text-red-600">
                  {dataToUse.length > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      Math.max(...dataToUse.filter(t => t.type === 'expense').map(t => t.amount), 0)
                    )
                    : 'R$ 0,00'}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Gasto Médio</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {dataToUse.length > 0
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      (dataToUse.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) / 30) // Simple 30-day avg for now
                    )
                    : 'R$ 0,00'}<span className="text-xs font-normal text-gray-400">/dia</span>
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Recorrentes</p>
                <p className="text-lg font-bold text-blue-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    dataToUse.filter(t => t.isRecurring && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
                  )}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Transações</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {dataToUse.length}
                </p>
              </div>
            </div>
          </div >

          <UpsellBanner />

          {/* Footer Links - Visible on all tabs at the bottom */}
          <div className="mt-12 pt-6 border-t border-border flex justify-center gap-6 text-xs text-muted-foreground pb-24 md:pb-6">
            <a href="mailto:devworks.company.io@gmail.com" className="hover:text-foreground transition-colors">
              Contato
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Termos de Uso
            </a>
          </div>
        </main >

        <div className="hidden md:block" id="desktop-add-btn">
          <MobileTransactionFab
            onAddIncome={handleAddIncome}
            onAddExpense={handleAddExpense}
          />
        </div>

        {
          isFree && (
            <div className="fixed bottom-28 right-4 z-40 sm:bottom-8 sm:right-8">
              <WhatsAppButton />
            </div>
          )
        }

        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onAddIncome={handleAddIncome}
          onAddExpense={handleAddExpense}
        />

        {/* Edit Dialogs */}
        {editingTransaction && editingTransaction.type === 'income' && (
          <AddIncomeDialog
            key={editingTransaction._id.toString()}
            open={!!editingTransaction}
            onOpenChange={(open) => !open && setEditingTransaction(null)}
            initialData={editingTransaction}
            onAddIncome={async (d, a, t, date, r, rc) => {
              await handleSaveEdit(d, a, t, date, r, rc)
              setEditingTransaction(null)
            }}
          />
        )}
        {editingTransaction && (editingTransaction.type === 'expense' || editingTransaction.type === 'transfer') && (
          <AddExpenseDialog
            key={editingTransaction._id.toString()}
            open={!!editingTransaction}
            onOpenChange={(open) => !open && setEditingTransaction(null)}
            initialData={editingTransaction}
            onAddExpense={async (d, a, t, date, r, rc) => {
              await handleSaveEdit(d, a, t, date, r, rc)
              setEditingTransaction(null)
            }}
          />
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

      </motion.div>
    </>
  )
}

function Dashboard() {
  const { currentProfileId, isLoading } = useCurrentProfile();

  if (isLoading) {
    return <GlobalLoader />;
  }

  return (
    <TransactionsProvider profileId={currentProfileId}>
      <GoalsProvider>
        <DashboardContent />
      </GoalsProvider>
    </TransactionsProvider>
  )
}

export default Dashboard;
