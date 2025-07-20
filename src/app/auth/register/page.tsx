'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from '@/components/ui/molecules/Title'
import Swal from 'sweetalert2'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cel, setCel] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, cel }),
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Cadastro realizado com sucesso.',
          confirmButtonText: "Entrar",
          timer: 3000,
        }).then(() => {
          router.push('/auth/login');
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: errorData.message || 'Erro ao realizar cadastro.',
        });
      }
    } catch (error: unknown) {
      console.error("Erro ao cadastrar:", error);

      let errorMessage = 'Ocorreu um erro ao tentar cadastrar. Por favor, tente novamente.';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      Swal.fire({
        icon: 'error',
        title: 'Erro inesperado!',
        text: errorMessage,
      });
    }
  }

  const routerLogin = () => {
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
      <CardHeader className='flex items-center justify-center'>
          <Title/>
          <CardTitle className="text-2xl font-bold text-center">Cadastro</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className='text-xl' htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='border-2 border-slate-600'
                placeholder='Escreva seu nome: '
                required
              />
            </div>
            <div className="space-y-2">
              <Label className='text-xl' htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='border-2 border-slate-600'
                placeholder='email@example.com'
                required
              />
            </div>
            <div className="space-y-2">
              <Label className='text-xl' htmlFor="cel">
                Número de Whatsapp
                <span className="ml-2 text-sm text-white bg-blue-600 px-2 py-0.5 rounded">
      WhatsApp + FinancePro
    </span>
              </Label>
              <Input
                  id="cel"
                  type="tel"
                  value={cel}
                  onChange={(e) => setCel(e.target.value)}
                  className='border-2 border-slate-600'
                  placeholder='(63) 91234-5678'
                  required
              />
            </div>

            <div className="space-y-2">
              <Label className='text-xl' htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='border-2 border-slate-600'
                placeholder='*********'
                required
              />
            </div>
            <Button type="submit" className="w-full text-xl bg-blue-600 text-white">Cadastrar</Button>
            <h2 className="text-xl text-black text-center">Já tem um conta?</h2>
            <Button onClick={routerLogin} className="w-full text-xl bg-blue-600 text-white">Fazer login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}