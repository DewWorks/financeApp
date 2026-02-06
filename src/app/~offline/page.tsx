"use client";

export default function OfflinePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Sem Conexão
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Parece que você está offline. Verifique sua conexão para continuar usando o FinancePro.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Tentar Novamente
            </button>
        </div>
    );
}
