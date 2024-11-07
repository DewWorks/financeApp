import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ITransaction } from "@/interfaces/ITransaction"

interface TransactionsTableProps {
  transactions: ITransaction[]
}

function getRandomColor() {
  return `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-black">
          <TableHead>Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Tag</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction, index) => {
          const tagColor = getRandomColor();
          return (
            <TableRow key={index} className={ transaction.type === 'income' ? 'bg-green-50' : 'bg-red-50'}>
              <TableCell className="text-black">{new Date(transaction.date).toLocaleDateString()}</TableCell>
              <TableCell className="text-black">{transaction.description}</TableCell>
              <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
  R$ {transaction.amount !== undefined && transaction.amount !== null ? transaction.amount.toFixed(2) : 'N/A'}
</TableCell>
              <TableCell className={transaction.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{transaction.type === 'income' ? 'Receita' : 'Despesa'}</TableCell>
              <TableCell>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-semibold" 
                  style={{ 
                    backgroundColor: `${tagColor}20`, 
                    color: tagColor, 
                    border: `1px solid ${tagColor}` 
                  }}
                >
                  {transaction.tag}
                </span>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}