import { useState, useEffect, useCallback } from 'react'
import { ITransaction } from '@/interfaces/ITransaction'
import {AuthErrorModal} from "@/components/ui/atoms/swalAuth";

export function useTransactions() {
  const [originalTransactions, setOriginalTransactions] = useState<ITransaction[]>([]);
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'auth' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [availableMonths, setAvailableMonths] = useState<number[]>([]);
  
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'auth') => {
    setToast({ message, type })
  }

  const getTransactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/transactions?page=${currentPage}&limit=10`);
      if (response.ok) {
        const data: { totalPages: number, transactions: ITransaction[]} = await response.json();
        if (data && data.transactions && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          setOriginalTransactions(data.transactions);
          setTotalPages(data.totalPages || 1);
          const months = Array.from(
              new Set(
                  data.transactions.map((transaction: { date: string | number | Date; }) =>
                      Number(new Date(transaction.date).getMonth() + 1)
                  )
              )
          ) as number[];
          setAvailableMonths(months.sort((a, b) => a - b));
        } else {
          console.error('Unexpected data format:', data);
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
  }, [currentPage]);

  useEffect(() => {
    if (selectedMonth !== null) {
      const filtered = originalTransactions.filter(
          transaction => new Date(transaction.date).getMonth() + 1 === selectedMonth
      );
      setTransactions(filtered);
      console.log("o tamanho das transactions: ", filtered)
      const newTotalPages = Math.floor(filtered.length / 10) || 1;
      console.log("o total pages: ", newTotalPages)
      setTotalPages(newTotalPages);
    } else {
      setTransactions(originalTransactions);
    }
  }, [selectedMonth, originalTransactions]);

  useEffect(() => {
    const transactions = getTransactions();
  }, [getTransactions]);

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
      getTransactions();
    }
  };

  const filteredTransactions = selectedMonth !== null
      ? originalTransactions.filter(transaction => new Date(transaction.date).getMonth() + 1 === selectedMonth)
      : originalTransactions;

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
    filteredTransactions,
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

