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
        fetchTransactions()
      } else {
        console.error('Failed to add transaction')
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
    }
  }

  return { transactions, addTransaction }
}