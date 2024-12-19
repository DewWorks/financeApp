import { useState, useEffect, useCallback } from 'react'
import { ITransaction } from '@/interfaces/ITransaction'
import {AuthErrorModal} from "@/components/ui/atoms/swalAuth";

export function useTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'auth' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'auth') => {
    setToast({ message, type })
  }

  const fetchTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          console.error('Data fetched is not an array:', data);
          setTransactions([]);
        }
      } else if (response.status === 401) {
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

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

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
    addTransaction,
    editTransaction,
    deleteTransaction,
    getTransaction,
    toast,
    setToast
  }
}

