import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select"
import { PlusIcon, CheckSquare, Square } from 'lucide-react'
import { expenseTags, ITransaction } from '@/interfaces/ITransaction'
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
  isRecurring: z.boolean().default(false),
  recurrenceCount: z.number().nullable().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface AddExpenseDialogProps {
  onAddExpense: (description: string, amount: number, tag: string, date: string, isRecurring: boolean, recurrenceCount: number) => void
  initialData?: ITransaction;
  trigger?: React.ReactNode;
}

export function AddExpenseDialog({ onAddExpense, initialData, trigger }: AddExpenseDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData || {
      description: '',
      amount: 0,
      tag: expenseTags[0],
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurrenceCount: null,
    },
  })

  const onSubmit = (data: ExpenseFormData) => {
    onAddExpense(data.description, data.amount, data.tag, data.date, data.isRecurring, data.recurrenceCount ?? 1)
    setIsOpen(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="outline" className="bg-red-500 text-white hover:bg-red-600">
            <PlusIcon className="h-4 w-4 mr-2" />
            Despesa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[425px] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">Adicionar Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Controller name="description" control={control} render={({ field }) => (
              <Input id="description" {...field} placeholder="Ex: Aluguel, Supermercado" />
            )} />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Controller name="amount" control={control} render={({ field }) => (
              <Input {...field} id="amount" type="number" step="0.01" onChange={(e) => field.onChange(parseFloat(e.target.value))} placeholder="R$ 0,00" />
            )} />
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">Categoria</Label>
            <Controller name="tag" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="max-h-10 overflow-y-auto">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="max-h-32 overflow-y-auto">
                  {expenseTags.map((tag) => (
                    <SelectItem className="bg-white dark:bg-gray-800 dark:text-white" key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            {errors.tag && <p className="text-red-500 text-sm">{errors.tag.message}</p>}
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
          <div className="space-y-2">
            <div className="flex items-center space-x-2 dark:text-white">
              <Controller name="isRecurring" control={control} render={({ field }) => (
                <button id="isRecurring" type="button" onClick={() => {
                  const newValue = !field.value;
                  field.onChange(newValue);
                  setIsRecurring(newValue);
                }}>
                  {field.value ? <CheckSquare className="w-5 h-5 text-red-500" /> : <Square className="w-5 h-5 text-gray-400" />}
                </button>
              )} />
              <Label className="cursor-pointer" htmlFor="isRecurring">Despesa recorrente</Label>
            </div>
          </div>

          {isRecurring && (
            <Controller
              name="recurrenceCount"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value ? field.value.toString() : undefined}
                >
                  <SelectTrigger className="max-h-10 overflow-y-auto">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-32 overflow-y-auto">
                    {[...Array(24).keys()].map((num) => (
                      <SelectItem className="bg-white dark:bg-gray-800 dark:text-white" key={num + 1} value={(num + 1).toString()}>
                        {num + 1} vezes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}

          <Button type="submit" className="bg-red-500 text-white w-full mt-6">Adicionar Despesa</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
