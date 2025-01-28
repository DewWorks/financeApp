'use client';

import { useRouter } from 'next/navigation';

export function AuthErrorModal () {
    const router = useRouter();

    return (
            <div className="fixed bottom-4 left-4 right-4 bg-red-500 text-white p-4 rounded-md shadow-lg flex justify-between items-center">
                <p>Sua sessão expirou. Por favor, faça login novamente para continuar usando nossa plataforma.</p>
                <button onClick={() => router.push('/auth/login') } className="text-white">
                    X
                </button>
            </div>
    );

};
