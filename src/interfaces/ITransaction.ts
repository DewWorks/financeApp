import { ObjectId } from "mongodb"

export interface ITransaction {
  _id: ObjectId
  userId: ObjectId
  profileId?: ObjectId,
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
  tag: string
  isRecurring?: boolean,
  recurrenceCount?: number,
  // Open Finance Fields
  pluggyTransactionId?: string;
  provider?: 'manual' | 'pluggy' | 'belvo';
  accountId?: string;
  category?: string; // Original category from provider
  status?: 'PENDING' | 'POSTED';
  createdAt: string | Date;
}

export type ReportFrequency = "weekly" | "biweekly" | "monthly"

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