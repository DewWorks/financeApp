export interface ITransaction {
    id: number
    type: 'income' | 'expense'
    description: string
    amount: number
    date: string
  }
  