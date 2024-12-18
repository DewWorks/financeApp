import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ToastProps {
    message: string
    type: 'success' | 'error' | 'warning'
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

    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500'

    return (
        <div className={`fixed bottom-4 left-4 right-4 ${bgColor} text-white p-4 rounded-md shadow-lg flex justify-between items-center`}>
            <p>{message}</p>
            <button onClick={() => setIsVisible(false)} className="text-white">
                <X size={20} />
            </button>
        </div>
    )
}
