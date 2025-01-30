import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select"
import { PlusIcon } from 'lucide-react'
import {expenseTags, ITransaction} from '@/interfaces/ITransaction'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const expenseTagsTuple = expenseTags as [string, ...string[]]

const expenseSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  tag: z.enum(expenseTagsTuple),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface AddExpenseDialogProps {
  onAddExpense: (description: string, amount: number, tag: string, date: string) => void
  initialData?: ITransaction;
}

export function AddExpenseDialog({ onAddExpense, initialData }: AddExpenseDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData || {
      description: '',
      amount: 0,
      tag: expenseTags[0],
      date: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = (data: ExpenseFormData) => {
    onAddExpense(data.description, data.amount, data.tag, data.date)
    setIsOpen(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-red-500 text-white hover:bg-red-600">
          <PlusIcon className="h-4 w-4 mr-2" />
          Despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[425px] dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center dark:text-white">Adicionar Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium dark:text-white">
              Descrição
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  id="description"
                  {...field}
                  placeholder="Ex: Aluguel, Supermercado"
                  className="w-full dark:text-white"
                />
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium dark:text-white">
              Valor (R$)
            </Label>
            <Controller
                name="amount"
                control={control}
                render={({ field }) => {
                  return (
                      <Input
                          {...field}
                          id="amount"
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          placeholder="R$ 0,00"
                          className="w-full dark:text-white"
                      />
                  );
                }}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag" className="text-sm font-medium dark:text-white">
              Categoria
            </Label>
            <Controller
              name="tag"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-full dark:text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTags.map((tag) => (
                      <SelectItem className='bg-white' key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tag && (
              <p className="text-red-500 text-sm">{errors.tag.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium dark:text-white">
              Data
            </Label>
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Input
                  id="date"
                  type="date"
                  {...field}
                  className="w-full dark:text-white"
                />
              )}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>
          <Button type="submit" className="bg-red-500 text-white w-full mt-6">
            Adicionar Despesa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}