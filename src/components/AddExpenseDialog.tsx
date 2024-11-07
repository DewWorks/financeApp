import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon } from 'lucide-react'
import { expenseTags } from '@/interfaces/ITransaction'

interface AddExpenseDialogProps {
  onAddExpense: (description: string, amount: number, tag: string) => void
}

export function AddExpenseDialog({ onAddExpense }: AddExpenseDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [tag, setTag] = useState(expenseTags[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numericAmount = !isNaN(parseFloat(amount)) ? parseFloat(amount) : 0
    onAddExpense(description, numericAmount, tag)
    setIsOpen(false)
    setDescription('')
    setAmount('')
    setTag(expenseTags[0])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-red-500 text-white hover:bg-red-600">
          <PlusIcon className="h-4 w-4 mr-2" />
          Despesa
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-center">Adicionar Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, Supermercado"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Valor (R$)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag" className="text-sm font-medium">
              Categoria
            </Label>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger className="w-full">
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
          </div>
          <Button type="submit" className="bg-red-500 text-white w-full mt-6">
            Adicionar Despesa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}