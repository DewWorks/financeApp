import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon } from 'lucide-react'

interface AddExpenseDialogProps {
  onAddExpense: (description: string, amount: number) => void
}

export function AddExpenseDialog({ onAddExpense }: AddExpenseDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddExpense(description, parseFloat(amount))
    setIsOpen(false)
    setDescription('')
    setAmount('')
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
          <Button type="submit" className="w-full">Adicionar Despesa</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}