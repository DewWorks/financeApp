import { ITransaction } from '@/interfaces/ITransaction'
import { useState, useEffect } from 'react'

export function useTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch('/api/transactions')
        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }
        const data = await response.json()
        setTransactions(data)
        setLoading(false)
      } catch (error: string | unknown) {
        console.log(error);
        setError('Error fetching transactions')
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const addTransaction = async (transaction: Omit<ITransaction, '_id'>) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      })

      if (!response.ok) {
        throw new Error('Failed to add transaction')
      }

      const newTransaction = await response.json()
      setTransactions(prev => [newTransaction, ...prev])
    } catch (error: string | unknown) {
        console.log(error);
        setError('Error fetching transactions')
        setLoading(false)
    }
  }

  return { transactions, addTransaction, loading, error }
}