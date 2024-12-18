import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ITransaction } from '@/interfaces/ITransaction'

export function useTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const router = useRouter()

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type })
  }

  const handleAuthError = useCallback(() => {
    const modal = document.createElement('div')
    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <img src="/logo.png" alt="Logo" class="mx-auto mb-4 w-24 h-24" />
          <h2 class="text-2xl font-bold mb-4 text-center">Sessão Expirada</h2>
          <p class="mb-6 text-center">Sua sessão expirou. Por favor, faça login novamente para continuar usando nossa plataforma.</p>
          <div class="flex justify-center space-x-4">
            <button id="loginBtn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Login</button>
            <button id="registerBtn" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Cadastrar</button>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(modal)

    const loginBtn = modal.querySelector('#loginBtn')
    const registerBtn = modal.querySelector('#registerBtn')

    loginBtn?.addEventListener('click', () => {
      document.body.removeChild(modal)
      router.push('/auth/login')
    })

    registerBtn?.addEventListener('click', () => {
      document.body.removeChild(modal)
      router.push('/auth/register')
    })
  }, [router])

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
        handleAuthError();
      } else {
        console.error('Failed to fetch transactions');
        showToast('Falha ao carregar transações. Por favor, tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      showToast('Ocorreu um erro ao carregar as transações. Por favor, tente novamente.', 'error');
    }
  }, [handleAuthError]);

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
        handleAuthError();
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
        handleAuthError();
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
        handleAuthError();
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
        handleAuthError();
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

