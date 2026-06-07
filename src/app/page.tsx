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
import { VoiceAssistantWidget } from "@/components/ui/molecules/VoiceAssistantWidget"
import { FinChatDialog } from "@/components/ui/organisms/FinChatDialog"
import { SmartImportDialog } from "@/components/ui/organisms/SmartImportDialog"

// Charts (Analytics Section)
import { CashFlowChart } from "@/components/ui/charts/CashFlowChart"
import { DistributionChart } from "@/components/ui/charts/DistributionChart"
import { RecentTransactionsChart } from "@/components/ui/charts/RecentTransactionChart"
import { IncomeVsExpensesChart } from "@/components/ui/charts/IncomeVsExpensesChart"
import { ChartTypeSelector } from "@/components/ui/charts/ChartTypeSelection"
import { Card, CardContent, CardTitle } from "@/components/ui/atoms/card"
import { Bell, PieChart, TrendingUp, TrendingDown, Mic } from "lucide-react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { IUser, PlanType } from "@/interfaces/IUser"
import { ObjectId } from "mongodb"
import { TransactionsProvider } from "@/context/TransactionsContext"
import { GoalsProvider } from "@/context/GoalsContext"
import { ITransaction } from "@/interfaces/ITransaction"
import { Button } from "@/components/ui/atoms/button"

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
  const [isFinChatOpen, setIsFinChatOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [autoStartVoice, setAutoStartVoice] = useState(false)
  const [isWakeWordActive, setIsWakeWordActive] = useState(false)
  const wakeRecognitionRef = useRef<any>(null)
  const [wakeLock, setWakeLock] = useState<any>(null)
  const [analyticsSubTab, setAnalyticsSubTab] = useState<"charts" | "goals">("charts")

  // Web Audio dual-tone wake chime
  const playWakeChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.error("Wake chime audio error", e);
    }
  }

  // Load wake word preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("wake-word-active") === "true";
      setIsWakeWordActive(active);
    }
  }, []);

  // Request Wake Lock to keep browser/screen alive during continuous voice mode
  useEffect(() => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;

    let activeLock: any = null;

    async function requestLock() {
      try {
        activeLock = await (navigator as any).wakeLock.request("screen");
        setWakeLock(activeLock);
        console.log("Wake Lock acquired successfully!");
      } catch (err) {
        console.error("Wake Lock failed to acquire:", err);
      }
    }

    if (isWakeWordActive && !isFinChatOpen) {
      requestLock();
    } else {
      if (wakeLock) {
        wakeLock.release().then(() => {
          setWakeLock(null);
          console.log("Wake Lock released.");
        });
      }
    }

    return () => {
      if (activeLock) {
        activeLock.release();
      }
    };
  }, [isWakeWordActive, isFinChatOpen]);

  // Background Wake Word listener activation
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.log("Speech recognition not supported in this browser.");
      return;
    }

    if (isWakeWordActive && !isFinChatOpen) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "pt-BR";

      rec.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const text = event.results[lastResultIndex][0].transcript.toLowerCase();
        
        console.log("Background listening text:", text);
        
        // Match phrases: "fin", "fim", "feen", "ei fin", "me ajude"
        if (text.includes("fin") || text.includes("fim") || text.includes("feen") || text.includes("me ajude")) {
          // Play beep
          playWakeChime();
          
          // Open Chat Dialog with Autostart
          setIsFinChatOpen(true);
          setActiveTab("fin");
          setAutoStartVoice(true);
          
          // Stop background listener temporarily so it doesn't cross-listen
          rec.stop();
        }
      };

      rec.onerror = (e: any) => {
        console.error("Wake recognition error:", e);
      };

      rec.onend = () => {
        // Automatically restart if it was stopped normally and chat is still closed
        if (isWakeWordActive && !isFinChatOpen) {
          try {
            rec.start();
          } catch (err) {
            console.error("Failed to restart wake listener:", err);
          }
        }
      };

      try {
        rec.start();
        wakeRecognitionRef.current = rec;
      } catch (err) {
        console.error("Failed to start wake listener:", err);
      }

      return () => {
        rec.stop();
        wakeRecognitionRef.current = null;
      };
    }
  }, [isWakeWordActive, isFinChatOpen]);

  // Check for PWA shortcut/voice parameters on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("startVoice") === "true") {
        // Clear param from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        setActiveTab("fin");
        setIsFinChatOpen(true);
        setAutoStartVoice(true);
      }
    }
  }, []);

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

  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      Notification.permission === "default"
    ) {
      setShowNotificationPrompt(true);
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleSubscribeNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShowNotificationPrompt(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined.");
        setToast({ message: "Erro de configuração de chaves Push.", type: "error" });
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      });

      if (response.ok) {
        setToast({ message: "Notificações ativadas com sucesso! 🔔", type: "success" });
      } else {
        setToast({ message: "Erro ao registrar as notificações no servidor.", type: "error" });
      }
      setShowNotificationPrompt(false);
    } catch (err) {
      console.error("Error subscribing to push notifications:", err);
      setShowNotificationPrompt(false);
    }
  };

  // Effect to update summary values based on profile/month
  useEffect(() => {
    if (summaryData) {
      setDisplayBalance(summaryData.balance);
      setDisplayIncome(summaryData.income);
      setDisplayExpense(summaryData.expense);
    }
  }, [summaryData]);

  // Sync activeTab to modal visibility for Fin Chat and Document Importer tabs
  useEffect(() => {
    if (activeTab === 'fin') {
      setIsFinChatOpen(true);
    } else if (activeTab === 'import') {
      setIsImportModalOpen(true);
    }
  }, [activeTab]);

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

  const refreshData = async () => {
    try {
      await Promise.all([
        getTransactions(),
        getSummary(),
        getChartData()
      ]);
    } catch (err) {
      console.error("Error refreshing dashboard data:", err);
    }
  };

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
          onOpenImportModal={() => setIsImportModalOpen(true)}
          setActiveTab={setActiveTab}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* SECURITY NUDGE */}
          <MfaNudge mfaEnabled={user?.mfaEnabled} />

          {/* NOTIFICATION PROMPT NUDGE */}
          {showNotificationPrompt && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 backdrop-blur-md text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-blue-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Bell className="h-6 w-6 text-blue-200 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base">🔔 Ative as Notificações de Economia</h4>
                  <p className="text-xs text-blue-100 max-w-lg mt-0.5">
                    Receba alertas de gastos, dicas rápidas do Fin AI e lembretes para manter suas finanças organizadas sem esforço!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowNotificationPrompt(false)} 
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 text-xs px-3 py-1.5 rounded-lg border-none"
                >
                  Depois
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSubscribeNotifications} 
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm"
                >
                  Ativar
                </Button>
              </div>
            </motion.div>
          )}

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
              onAddIncome={handleAddIncome}
              onAddExpense={handleAddExpense}
            />

            {/* Fin — Co-Piloto de IA */}
            {/* Hands-Free Wake Word Card */}
            <div className="mb-6 bg-gradient-to-br from-indigo-900/10 to-purple-900/10 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-500/15 dark:border-indigo-500/10 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-all ${isWakeWordActive ? 'bg-indigo-600 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    Comando de Voz: "Ei Fin"
                    {isWakeWordActive && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 max-w-xs sm:max-w-md mt-0.5 leading-relaxed">
                    Diga **"Fin, me ajude"** ou **"Ei Fin"** para abrir o assistente de voz com as mãos livres.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const nextState = !isWakeWordActive;
                  setIsWakeWordActive(nextState);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("wake-word-active", nextState.toString());
                  }
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isWakeWordActive ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isWakeWordActive ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            <div className="mb-8">
              <VoiceAssistantWidget onRefresh={refreshData} />
            </div>

            <div className="mb-8">
              <OpenFinanceWidget />
            </div>
          </div>

          {/* SECTION: GOALS (Desktop only, mobile consolidated under Analytics) */}
          <div className="hidden md:block">
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
              onAddIncome={handleAddIncome}
              onAddExpense={handleAddExpense}
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
            
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl mb-6 max-w-[240px] mx-auto border border-gray-200/50 dark:border-gray-700">
              <button
                onClick={() => setAnalyticsSubTab("charts")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${analyticsSubTab === "charts" ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"}`}
              >
                Gráficos
              </button>
              <button
                onClick={() => setAnalyticsSubTab("goals")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${analyticsSubTab === "goals" ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"}`}
              >
                Metas
              </button>
            </div>

            {/* Desktop View: Render both stacked */}
            <div className="hidden md:block">
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
            </div>

            {/* Mobile View: Render either charts + highlights OR goals */}
            <div className="md:hidden">
              {analyticsSubTab === "charts" ? (
                <>
                  <motion.div id="transactions-chart-mobile" variants={itemVariants}>
                    <Card className="bg-white dark:bg-gray-800 shadow-lg mb-8">
                      <div className="flex flex-col justify-between items-center p-2 border-b border-gray-100 dark:border-gray-700">
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 p-2 text-center">
                          Análise Financeira
                        </CardTitle>
                        <ChartTypeSelector selectedType={selectedChartType} onSelectType={setSelectedChartType} />
                      </div>
                      <CardContent className="p-4 min-h-[280px] h-auto">
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
                </>
              ) : (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg mb-8">
                  <DashboardGoals transactions={dataToUse} />
                </div>
              )}
            </div>
          </div>

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

        {/* Fin AI Chat & File Import Modals */}
        <FinChatDialog 
          isOpen={isFinChatOpen} 
          onClose={() => {
            setIsFinChatOpen(false)
            setActiveTab('home')
            setAutoStartVoice(false)
          }} 
          onRefresh={refreshData}
          autoStartVoice={autoStartVoice}
        />
        <SmartImportDialog 
          isOpen={isImportModalOpen} 
          onClose={() => {
            setIsImportModalOpen(false)
            setActiveTab('home')
          }} 
          onRefresh={refreshData}
        />

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
