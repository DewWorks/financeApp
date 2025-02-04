import { useState, useEffect, useCallback } from 'react'
import { ITransaction } from '@/interfaces/ITransaction'
import {AuthErrorModal} from "@/components/ui/atoms/swalAuth";

export function useTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState<ITransaction[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'auth' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'auth') => {
    setToast({ message, type })
  }

  const getMonthlyTransactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/transactions/month?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyTransactions(data.transactions);
      } else {
        showToast('Erro ao carregar transações do mês.', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar transações do mês:', error);
      showToast('Ocorreu um erro ao carregar transações do mês.', 'error');
    }
  }, [selectedMonth]);

  // ✅ Carregar transações paginadas para a tabela
  const getTransactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/transactions?page=${currentPage}&limit=10&month=${selectedMonth}`);
      if (response.ok) {
        const data: { totalPages: number; transactions: ITransaction[] } = await response.json();
        setTransactions(data.transactions);
        setTotalPages(data.totalPages || 1);
      } else {
        showToast('Falha ao carregar transações.', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      showToast('Erro ao carregar transações.', 'error');
    }
  }, [currentPage, selectedMonth]);

  useEffect(() => {
    getMonthlyTransactions(); // Carregar todas as transações do mês para gráficos e totais
    getTransactions(); // Carregar apenas as transações paginadas para a tabela
  }, [currentPage, selectedMonth, getTransactions]);

  useEffect(() => {
    // 🔹 Se houver transações, extrai os meses disponíveis delas
    if (transactions.length > 0) {
      const months = Array.from(
          new Set(
              transactions.map((transaction) => new Date(transaction.date).getMonth() + 1)
          )
      ).sort((a, b) => a - b); // Ordena os meses corretamente

      setAvailableMonths(months);
    }
  }, [transactions]); // Atualiza quando `transactions` mudar

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const filterTransactionsByMonth = (month: number | null) => {
    setSelectedMonth(month);
    if (month === null) {
      // Recarrega os dados da API para garantir que originalTransactions contenha todas as transações
      // getTransactions();
      setCurrentPage(1);
    }
  };

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/transactions');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
        } else {
          console.error('Data fetched is not an array:', data);
          setTransactions([]);
        }
      } else if (response.status === 401) {
        setToast({ message: 'Erro de autenticação', type: 'auth' });
        showToast('Erro de autenticação', 'auth');
      } else {
        console.error('Failed to fetch transactions');
        showToast('Falha ao carregar transações. Por favor, tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      showToast('Ocorreu um erro ao carregar as transações. Por favor, tente novamente.', 'error');
    }
  }, [AuthErrorModal]);

  const addTransaction = async (transaction: Partial<ITransaction>) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction)
      })
      if (response.ok) {
        await fetchTransactions()
        showToast('Transação adicionada com sucesso!', 'success');
      } else if (response.status === 401) {
        showToast('Erro de autenticação', 'auth');
      } else {
        const errorData = await response.json()
        console.error('Failed to add transaction:', errorData.error)
        showToast('Falha ao adicionar transação. Por favor, tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
      showToast('Ocorreu um erro ao adicionar a transação. Por favor, tente novamente.', 'error');
    }
  }

  const editTransaction = async (updatedTransaction: Partial<ITransaction>) => {
    try {
      const response = await fetch(`/api/transactions/${updatedTransaction._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction)
      })

      if (response.ok) {
        await fetchTransactions()
        showToast('Transação atualizada com sucesso!', 'success');
      } else if (response.status === 401) {
        showToast('Erro de autenticação', 'auth');
      } else {
        const errorData = await response.json()
        console.error('Failed to edit transaction:', errorData.error)
        showToast('Falha ao atualizar transação. Por favor, tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Error editing transaction:', error)
      showToast('Ocorreu um erro ao atualizar a transação. Por favor, tente novamente.', 'error');
    }
  }

  const deleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchTransactions()
        showToast('A transação foi excluída com sucesso.', 'success');
      } else if (response.status === 401) {
        showToast('Erro de autenticação', 'auth');
      } else {
        const errorData = await response.json()
        console.error('Failed to delete transaction:', errorData.error)
        showToast('Falha ao excluir transação. Por favor, tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      showToast('Ocorreu um erro ao excluir a transação. Por favor, tente novamente.', 'error');
    }
  }

  const getTransaction = async (transactionId: string): Promise<ITransaction | null> => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`)
      if (response.ok) {
        return await response.json()
      } else if (response.status === 401) {
        showToast('Erro de autenticação', 'auth');
        return null;
      } else {
        console.error('Failed to get transaction')
        showToast('Falha ao obter detalhes da transação. Por favor, tente novamente.', 'error');
        return null
      }
    } catch (error) {
      console.error('Error getting transaction:', error)
      showToast('Ocorreu um erro ao obter detalhes da transação. Por favor, tente novamente.', 'error');
      return null
    }
  }

  return {
    transactions,
    monthlyTransactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    getTransaction,
    toast,
    setToast,
    currentPage,
    totalPages,
    handlePreviousPage,
    handleNextPage,
    filterTransactionsByMonth,
    selectedMonth,
    availableMonths
  }
}

