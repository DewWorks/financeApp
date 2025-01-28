import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Swal from 'sweetalert2'

interface ToastProps {
    message: string
    type: 'success' | 'error' | 'warning' | 'auth'
    duration?: number
    onClose: () => void
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false)
            onClose()
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onClose])

    if (!isVisible) return null

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'auth' ? 'bg-yellow-500' : 'bg-yellow-500'

    const handleAuthClick = () => {
        Swal.fire({
            title: 'Autenticação necessária',
            html: `
                <div class="flex flex-col items-center">
                    <h2 class="text-lg font-semibold">Faça login para continuar</h2>
                    <button class="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={() => window.location.href = '/login'}>
                        Fazer Login
                    </button>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'p-4 bg-white rounded-lg shadow-md',
                title: 'text-lg font-semibold',
                htmlContainer: 'flex flex-col items-center'
            }
        })
    }

    const handleButtonClick = () => {
        if (type === 'auth') {
            handleAuthClick()
        } else {
            setIsVisible(false)
        }
    }

    return (
        <div onClick={handleButtonClick} className={`fixed bottom-4 left-4 right-4 ${bgColor} text-white p-4 rounded-md shadow-lg flex justify-between items-center`}>
            <p>{message}</p>
            <X size={20} />
        </div>
    )
}
