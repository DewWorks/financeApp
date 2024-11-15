import { CreditCard } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-gradient-to-r from-green-600 to-green-800 text-white py-12 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-center mb-4">
          <CreditCard className="h-12 w-12 mr-4" />
          <h1 className="text-4xl font-bold">Controle Financeiro</h1>
        </div>
        <p className="text-center text-xl max-w-2xl mx-auto">
          Gerencie suas finanças de forma simples e eficiente. Acompanhe suas receitas e despesas, 
          visualize seu saldo e tome decisões financeiras inteligentes.
        </p>
      </div>
    </header>
  )
}