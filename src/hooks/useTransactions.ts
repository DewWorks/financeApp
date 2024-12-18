import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { ITransaction } from '@/interfaces/ITransaction'

export function useTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const router = useRouter()

  const handleAuthError = useCallback(() => {
    Swal.fire({
      title: 'Usuário Desconectado',
      text: 'Sua sessão expirou. Por favor, faça login novamente.',
      icon: 'warning',
      confirmButtonText: 'OK'
    }).then(() => {
      router.push('/auth/login')
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
        Swal.fire({
          title: 'Erro',
          text: 'Falha ao carregar transações. Por favor, tente novamente.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      Swal.fire({
        title: 'Erro',
        text: 'Ocorreu um erro ao carregar as transações. Por favor, tente novamente.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
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
        Swal.fire({
          title: 'Sucesso',
          text: 'Transação adicionada com sucesso!',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else if (response.status === 401) {
        handleAuthError();
      } else {
        const errorData = await response.json()
        console.error('Failed to add transaction:', errorData.error)
        Swal.fire({
          title: 'Erro',
          text: 'Falha ao adicionar transação. Por favor, tente novamente.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
      Swal.fire({
        title: 'Erro',
        text: 'Ocorreu um erro ao adicionar a transação. Por favor, tente novamente.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
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
        Swal.fire({
          title: 'Sucesso',
          text: 'Transação atualizada com sucesso!',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else if (response.status === 401) {
        handleAuthError();
      } else {
        const errorData = await response.json()
        console.error('Failed to edit transaction:', errorData.error)
        Swal.fire({
          title: 'Erro',
          text: 'Falha ao atualizar transação. Por favor, tente novamente.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error editing transaction:', error)
      Swal.fire({
        title: 'Erro',
        text: 'Ocorreu um erro ao atualizar a transação. Por favor, tente novamente.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }

  const deleteTransaction = async (transactionId: string) => {
    try {
      const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: 'Tem certeza que deseja excluir esta transação?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          await fetchTransactions()
          Swal.fire({
            title: 'Excluído!',
            text: 'A transação foi excluída com sucesso.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } else if (response.status === 401) {
          handleAuthError();
        } else {
          const errorData = await response.json()
          console.error('Failed to delete transaction:', errorData.error)
          Swal.fire({
            title: 'Erro',
            text: 'Falha ao excluir transação. Por favor, tente novamente.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      Swal.fire({
        title: 'Erro',
        text: 'Ocorreu um erro ao excluir a transação. Por favor, tente novamente.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
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
        Swal.fire({
          title: 'Erro',
          text: 'Falha ao obter detalhes da transação. Por favor, tente novamente.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return null
      }
    } catch (error) {
      console.error('Error getting transaction:', error)
      Swal.fire({
        title: 'Erro',
        text: 'Ocorreu um erro ao obter detalhes da transação. Por favor, tente novamente.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return null
    }
  }

  return { transactions, addTransaction, editTransaction, deleteTransaction, getTransaction }
}

