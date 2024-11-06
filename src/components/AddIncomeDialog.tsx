import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon } from 'lucide-react'

interface AddIncomeDialogProps {
  onAddIncome: (description: string, amount: number) => void
}

export function AddIncomeDialog({ onAddIncome }: AddIncomeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddIncome(description, parseFloat(amount))
    setIsOpen(false)
    setDescription('')
    setAmount('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-green-500 text-white hover:bg-green-600">
          <PlusIcon className="h-4 w-4 mr-2" />
          Receita
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Receita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário, Freelance"
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
          <Button type="submit" className="w-full">Adicionar Receita</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}