'use client'

import { useTransactions } from '@/hooks/useTransactions'
import { driver } from "driver.js";
import 'driver.js/dist/driver.css'
import { Card, CardContent, CardTitle } from "@/components/ui/atoms/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, LogIn, LogOut } from 'lucide-react'
import { AddIncomeDialog } from '@/components/ui/organisms/AddIncomeDialog'
import { AddExpenseDialog } from '@/components/ui/organisms/AddExpenseDialog'
import { ITransaction } from '@/interfaces/ITransaction'
import { SummaryCard } from '@/components/ui/molecules/SummaryCard'
import { TransactionsTable } from '@/components/ui/molecules/TransactionsTable'
import { Button } from '@/components/ui/atoms/button'
import { useRouter } from 'next/navigation'
import { Title } from '@/components/ui/molecules/Title'
import { motion } from 'framer-motion'
import { CashFlowChart } from "@/components/ui/charts/CashFlowChart"
import { DistributionChart } from "@/components/ui/charts/DistributionChart"
import { RecentTransactionsChart } from "@/components/ui/charts/RecentTransactionChart"
import { IncomeVsExpensesChart } from "@/components/ui/charts/IncomeVsExpensesChart"
import { Toast } from "@/components/ui/atoms/toast"
import { FinancialGoals } from "@/components/ui/organisms/FinancialGoals"
import {useEffect, useState} from "react";
import Swal from "sweetalert2";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function DashboardFinanceiro() {
  const router = useRouter()
  const { transactions, addTransaction, editTransaction, deleteTransaction, toast, setToast } = useTransactions()

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  const hasSeenTutorial = localStorage.getItem('tutorial-guide')
  const userId = localStorage.getItem('user-id')

  const pieChartData = [
    { name: 'Receitas', value: totalIncome },
    { name: 'Despesas', value: totalExpense },
  ]

  const barChartData = transactions.slice(0, 5).map(t => ({
    name: t.description,
    valor: t.amount,
    tipo: t.type === 'income' ? 'Receita' : 'Despesa',
    tag: t.tag
  }))

  const lineChartData = transactions.slice(0, 10).map(t => ({
    data: t.date,
    valor: t.type === 'income' ? t.amount : -t.amount,
    tag: t.tag
  }))

  const areaChartData = transactions.slice(0, 15).map(t => ({
    data: t.date,
    receita: t.type === 'income' ? t.amount : 0,
    despesa: t.type === 'expense' ? t.amount : 0,
  }))

  const [runTutorial, setRunTutorial] = useState(false)

  // Verificar se o tutorial já foi visto
  useEffect(() => {
    if (hasSeenTutorial === 'false') {
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
        localStorage.setItem('tutorial-guide', 'true')
      },
      popoverClass: "custom-popover", 
    })

    driverObj.setSteps([
      {
        popover: {
          title: "🚀 Bem-vindo ao FinancePro!",
          description: "Vamos te guiar pelos principais recursos do sistema para que você aproveite ao máximo!",
          showButtons: ["next"],
        }
      },
      {
        element: '#transactions-values',
        popover: {
          title: '💰 Resumo Financeiro',
          description: 'Aqui você pode ver o saldo total e o resumo das finanças.',
          onCloseClick: () => driverObj.destroy(),
        }
      },
      {
        element: '#add-transactions',
        popover: {
          title: '➕ Adicionar Transações',
          description: 'Clique aqui para adicionar suas transações.',
        }
      },
      {
        element: '#transactions-goals',
        popover: {
          title: '🎯 Metas Financeiras',
          description: 'Aqui estão todas as suas metas financeiras.',
        }
      },
      {
        element: '#transactions-table',
        popover: {
          title: '📊 Histórico de Transações',
          description: 'Aqui estão todas as suas transações financeiras.',
        }
      },
      {
        element: '#transactions-chart',
        popover: {
          title: '📈 Gráficos Financeiros',
          description: 'Esses gráficos mostram a sua situação financeira em detalhes.',
          onCloseClick: () => driverObj.destroy(),
          onNextClick: async () => {
            driverObj.destroy(); // Finaliza o tutorial
            window.scrollTo({top: 0, behavior: "smooth"}); // Retorna ao topo

            try {
              await fetch("/api/admin/users/tutorialFinished", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
              });

              console.log("Tutorial status updated successfully");

              const hasSeenTutorial = localStorage.setItem('tutorial-guide', true.toString())
            } catch (error) {
              console.error("Failed to update tutorial status:", error);
            }

            // Exibe alerta de sucesso
            Swal.fire({
              title: "🎉 Tutorial Concluído!",
              text: "Parabéns! Agora você pode começar no FinancePro!💸",
              icon: "success",
              confirmButtonText: "Começar já!",
              timer: 5000, // Fecha automaticamente após 5 segundos
              showConfirmButton: true
            });
          }
        }
      }
    ])

    driverObj.drive()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  const handleLogin = () => {
    router.push('/auth/login')
  }

  const handleAddIncome = (description: string, amount: number, tag: string, date: string) => {
    const newTransaction: Partial<ITransaction> = {
      type: 'income',
      description,
      amount,
      date,
      tag
    }
    addTransaction(newTransaction)
  }

  const handleAddExpense = (description: string, amount: number, tag: string, date: string) => {
    const newTransaction: Partial<ITransaction> = {
      type: 'expense',
      description,
      amount,
      date,
      tag
    }
    addTransaction(newTransaction)
  }

  const handleEditTransaction = async (updatedTransaction: Partial<ITransaction>) => {
    await editTransaction(updatedTransaction)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    await deleteTransaction(transactionId)
  }

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      Swal.fire({
        title: 'Autenticação necessária',
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
          popup: 'p-4 bg-white rounded-lg shadow-md',
          title: 'text-lg font-semibold',
          htmlContainer: 'flex flex-col items-center'
        }
      })
    }
  }, [])

  return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <Title/>
            </div>
            <div className="flex items-center">
              <Button onClick={handleLogin} variant="ghost">
                <LogIn className="h-5 w-5 mr-2" />
                Entrar
              </Button>
              <Button onClick={handleLogout} variant="ghost">
                <LogOut className="h-5 w-5 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
              initial={{opacity: 0, y: -20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.5}}
              className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
              <p className="mt-1 text-sm text-gray-600">Visão geral das suas finanças pessoais</p>
            </div>
            <div className="space-x-2" id="add-transactions">
              <AddIncomeDialog onAddIncome={handleAddIncome}/>
              <AddExpenseDialog onAddExpense={handleAddExpense}/>
            </div>
          </motion.div>

          <motion.div
              id="transactions-values"
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.5, delay: 0.2}}
              className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            <SummaryCard
                title="Saldo Total"
                value={balance}
                icon={DollarSign}
                description="Atualizado agora"
            />
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
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.5, delay: 0.4}}
              className="mb-8"
          >
            <FinancialGoals />
          </motion.div>

          <motion.div
              initial={{opacity: 0, y: 20}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.5, delay: 0.6}}
          >
            <Card className="bg-white shadow-lg mb-8">
              <CardTitle id="transactions-table" className="text-lg font-semibold text-gray-900">Todas as Transações</CardTitle>
              <CardContent>
                <TransactionsTable
                    transactions={transactions}
                    onEditTransaction={handleEditTransaction}
                    onDeleteTransaction={handleDeleteTransaction}/>
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
              </CardContent>
            </Card>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2" id="transactions-chart" >
            <DistributionChart pieChartData={pieChartData} colors={COLORS}/>
            <RecentTransactionsChart barChartData={barChartData}/>
          </div>

          <CashFlowChart lineChartData={lineChartData}/>
          <IncomeVsExpensesChart areaChartData={areaChartData}/>
        </main>
      </div>
  )
}

