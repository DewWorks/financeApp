'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/atoms/button"
import { Input } from "@/components/ui/atoms/input"
import { Label } from "@/components/ui/atoms/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card"
import { Title } from '@/components/ui/molecules/Title'
import Swal from "sweetalert2";

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data: { token: string, tutorialGuide: boolean, executeQuery: boolean, userId: string } = await response.json();
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('tutorial-guide', data.tutorialGuide.toString());
        localStorage.setItem('execute-query', data.executeQuery.toString());
        localStorage.setItem('user-id', data.userId.toString());
        Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          text: 'Login realizado com sucesso.',
          confirmButtonText: "Entrar",
          timer: 3000,
        }).then(() => {
          router.push('/')
        })
      } else {
        const errorData = await response.json()
        Swal.fire({
          icon: 'error',
          title: 'Erro!',
          text: errorData.message || 'Erro ao realizar login.',
        })
      }
    } catch (error) {
      console.error('Login error:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erro!',
        text: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
      })
    }
  }
  const routerRegister = () => {
    router.push('/auth/register')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className='flex items-center justify-center'>
          <Title/>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 text-xl">
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
              <Label className='text-xl' htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='border-2 border-slate-600'
                placeholder='***********'
                required
              />
            </div>
            <Button type="submit" className="w-full text-xl bg-blue-600 text-white">Entrar</Button>
            <h2 className="text-xl text-black text-center">Não possui uma conta?</h2>
            <Button onClick={routerRegister} className="w-full text-xl bg-blue-600 text-white">Cadastrar-se</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}