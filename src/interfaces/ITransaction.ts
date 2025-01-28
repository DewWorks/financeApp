import { ObjectId } from "mongodb"

export interface ITransaction {
  _id: ObjectId
  userId: ObjectId
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
  tag: string
}

export const expenseTags = [
  "Transporte",
  "Alimentação",
  "Custos de Vida",
  "Aluguel",
  "Utensílios",
  "Lazer",
  "Saúde",
  "Educação",
  "Outros"
]

export const incomeTags = [
  "Salário",
  "Freelancer",
  "Venda",
  "Presente",
  "Investimentos",
  "Outros"
]