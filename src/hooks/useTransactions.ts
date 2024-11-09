import { useState, useEffect } from 'react'
import { ITransaction } from '@/interfaces/ITransaction'

export function useTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else {
        console.error('Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

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
      } else {
        const errorData = await response.json()
        console.error('Failed to add transaction:', errorData.error)
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
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
      } else {
        const errorData = await response.json()
        console.error('Failed to edit transaction:', errorData.error)
      }
    } catch (error) {
      console.error('Error editing transaction:', error)
    }
  }

  const deleteTransaction = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchTransactions()
      } else {
        const errorData = await response.json()
        console.error('Failed to delete transaction:', errorData.error)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const getTransaction = async (transactionId: string): Promise<ITransaction | null> => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`)
      if (response.ok) {
        return await response.json()
      } else {
        console.error('Failed to get transaction')
        return null
      }
    } catch (error) {
      console.error('Error getting transaction:', error)
      return null
    }
  }

  return { transactions, addTransaction, editTransaction, deleteTransaction, getTransaction }
}