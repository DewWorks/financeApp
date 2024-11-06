import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";
import { ITransaction } from "../interfaces/ITransaction";

export function TransactionChart({ transactions }: { transactions: ITransaction[] }) {
  const data = transactions.map(t => ({
    name: t.description,
    value: t.amount,
    color: t.type === 'income' ? '#10B981' : '#EF4444'
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Bar dataKey="value">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
