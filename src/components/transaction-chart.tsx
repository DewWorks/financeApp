import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ITransaction } from "../interfaces/ITransaction"

export function TransactionChart({ transactions }: { transactions: ITransaction[] }) {
  const data = transactions.map(t => ({
    name: t.description,
    value: t.amount,
    color: t.type === 'income' ? '#10B981' : '#EF4444'
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value" fill={(entry) => entry.color} />
      </BarChart>
    </ResponsiveContainer>
  )
}