import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select"
import { PlusIcon } from 'lucide-react'
import {incomeTags, ITransaction} from '@/interfaces/ITransaction'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const incomeTagsTuple = incomeTags as [string, ...string[]]

const incomeSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  tag: z.enum(incomeTagsTuple),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }),
})

type IncomeFormData = z.infer<typeof incomeSchema>

interface AddIncomeDialogProps {
  onAddIncome: (description: string, amount: number, tag: string, date: string) => void
  initialData?: ITransaction;
}

export function AddIncomeDialog({ onAddIncome }: AddIncomeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      description: '',
      amount: 0,
      tag: incomeTags[0],
      date: new Date().toISOString().split('T')[0],
    },
  })

  const onSubmit = (data: IncomeFormData) => {
    onAddIncome(data.description, data.amount, data.tag, data.date)
    setIsOpen(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-green-500 text-white hover:bg-green-600">
          <PlusIcon className="h-4 w-4 mr-2" />
          Receita
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">Adicionar Receita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  id="description"
                  {...field}
                  placeholder="Ex: Salário, Freelance"
                  className="w-full"
                />
              )}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Valor (R$)
            </Label>
            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full"
                />
              )}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag" className="text-sm font-medium">
              Categoria
            </Label>
            <Controller
              name="tag"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeTags.map((tag) => (
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
            <Label htmlFor="date" className="text-sm font-medium">
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
                  className="w-full"
                />
              )}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>
          <Button type="submit" className="bg-green-500 text-white w-full mt-6">
            Adicionar Receita
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}