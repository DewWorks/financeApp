'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

interface AuthWrapperProps {
    children: React.ReactNode;
    error?: string;
}

export default function AuthWrapper({ children, error }: AuthWrapperProps) {
    const router = useRouter()

    useEffect(() => {
        if (error) {
            Swal.fire({
                title: 'Usuário Desconectado',
                text: 'Sua sessão expirou. Por favor, faça login novamente.',
                icon: 'warning',
                confirmButtonText: 'OK'
            }).then(() => {
                router.push('/auth/login')
            })
        }
    }, [error, router])

    if (error) {
        return null; // or a loading spinner
    }

    return <>{children}</>
}

