import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/atoms/dialog"
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/atoms/select"
import { incomeTags, ITransaction } from '@/interfaces/ITransaction'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, CheckSquare, Square } from 'lucide-react'
import * as z from 'zod'

const incomeTagsTuple = incomeTags as [string, ...string[]]

const incomeSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('O valor deve ser positivo'),
  tag: z.enum(incomeTagsTuple),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data inválida',
  }),
  isRecurring: z.boolean().default(false),
  recurrenceCount: z.number().nullable().optional(),
})

type IncomeFormData = z.infer<typeof incomeSchema>

interface AddIncomeDialogProps {
  onAddIncome: (description: string, amount: number, tag: string, date: string, isRecurring: boolean,
    recurrenceCount: number) => void
  initialData?: ITransaction
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddIncomeDialog({ onAddIncome, initialData, trigger, open: externalOpen, onOpenChange: externalOnOpenChange }: AddIncomeDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isControlled = externalOpen !== undefined

  const isOpen = isControlled ? externalOpen : internalIsOpen
  const setIsOpen = isControlled ? externalOnOpenChange! : setInternalIsOpen

  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false)
  const isEditMode = !!initialData

  const { control, handleSubmit, reset, formState: { errors } } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: initialData ? {
      description: initialData.description,
      amount: initialData.amount,
      tag: initialData.tag as any,
      date: initialData.date.split('T')[0],
      isRecurring: initialData.isRecurring,
      recurrenceCount: initialData.recurrenceCount
    } : {
      description: '',
      amount: 0,
      tag: incomeTags[0],
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurrenceCount: null,
    },
  })

  // Reset form when initialData changes or dialog opens
  // (Simplified for now, expecting distinct component instances or key reset)

  const onSubmit = (data: IncomeFormData) => {
    onAddIncome(data.description, data.amount, data.tag, data.date, data.isRecurring, data.recurrenceCount ?? 1)
    if (!isControlled) setIsOpen(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          !isControlled && (
            <Button variant="outline" className="bg-green-500 text-white hover:bg-green-600">
              <PlusIcon className="h-4 w-4 mr-2" />
              Receita
            </Button>
          )
        )}
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[425px] dark:bg-gray-800 dark:text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">{isEditMode ? 'Editar Receita' : 'Adicionar Receita'}</DialogTitle>
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
                  placeholder="Ex: Salário, Freelance"
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
              render={({ field }) => (
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full dark:text-white"
                />
              )}
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
                    {incomeTags.map((tag) => (
                      <SelectItem className='bg-white dark:bg-gray-800 dark:text-white' key={tag} value={tag}>
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
              <Label className="cursor-pointer" htmlFor="isRecurring">Receita recorrente</Label>
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
                  <SelectTrigger className="max-h-10 overflow-y-auto dark:text-white">
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
          <Button type="submit" className="bg-green-500 text-white w-full mt-6">
            {isEditMode ? 'Salvar Alterações' : 'Adicionar Receita'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}