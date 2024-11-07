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

    // Garantir que amount é um número válido
    const numericAmount = !isNaN(parseFloat(amount)) ? parseFloat(amount) : 0; // Se não for um número, usa 0

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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Despesa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, Supermercado"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag">Categoria</Label>
            <Select value={tag} onValueChange={setTag}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Adicionar Despesa</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}