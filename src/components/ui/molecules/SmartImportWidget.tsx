"use client"

import { useState, useRef } from "react"
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, X, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/atoms/button"

interface SmartImportWidgetProps {
    onRefresh: () => Promise<void>;
}

export function SmartImportWidget({ onRefresh }: SmartImportWidgetProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isDragActive, setIsDragActive] = useState(false)
    const [status, setStatus] = useState<"idle" | "selected" | "loading" | "success" | "error">("idle")
    const [message, setMessage] = useState("")
    const [importedCount, setImportedCount] = useState(0)
    const [importedList, setImportedList] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true)
        } else if (e.type === "dragleave") {
            setIsDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0]
            const extension = droppedFile.name.split(".").pop()?.toLowerCase()
            if (extension === "pdf" || extension === "csv") {
                setFile(droppedFile)
                setStatus("selected")
                setMessage("")
            } else {
                setStatus("error")
                setMessage("Formato não suportado. Por favor, envie apenas arquivos PDF ou CSV.")
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setStatus("selected")
            setMessage("")
        }
    }

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleImport = async () => {
        if (!file) return

        setStatus("loading")
        const formData = new FormData()
        formData.append("file", file)

        try {
            const response = await fetch("/api/transactions/import-file", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.error || "Erro ao importar arquivo.")
            }

            const data = await response.json()
            setImportedCount(data.importedCount || 0)
            setImportedList(data.transactions || [])
            setStatus("success")

            if (onRefresh) {
                await onRefresh()
            }
        } catch (error: any) {
            console.error("Import error:", error)
            setStatus("error")
            setMessage(error.message || "Ocorreu um erro no processamento do arquivo. Certifique-se de que é um extrato válido.")
        }
    }

    const resetWidget = () => {
        setFile(null)
        setStatus("idle")
        setMessage("")
        setImportedCount(0)
        setImportedList([])
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const formatBytes = (bytes: number, decimals = 2) => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ["Bytes", "KB", "MB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
    }

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6 flex flex-col justify-between h-full min-h-[200px]">
            {/* Background decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-xl pointer-events-none" />

            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500">
                            <UploadCloud className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                Importador Inteligente
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                Importe dezenas de transações por PDF ou CSV do banco
                            </p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                        Sem Custo
                    </span>
                </div>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.csv"
                    className="hidden"
                />

                {/* Drop Zone / Display */}
                <div className="min-h-[100px] flex flex-col justify-center">
                    {status === "idle" && (
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={handleButtonClick}
                            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                                isDragActive
                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10"
                                    : "border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 hover:bg-gray-50 dark:hover:bg-gray-900/30"
                            }`}
                        >
                            <UploadCloud className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                Arraste seu PDF/CSV de extrato ou clique para selecionar
                            </p>
                            <span className="text-[9px] text-gray-400">Suporta Nubank, Itaú, Bradesco, etc.</span>
                        </div>
                    )}

                    {status === "selected" && file && (
                        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 p-3 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                {file.name.endsWith(".csv") ? (
                                    <FileSpreadsheet className="w-8 h-8 text-teal-500 flex-shrink-0" />
                                ) : (
                                    <FileText className="w-8 h-8 text-red-400 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">
                                        {file.name}
                                    </p>
                                    <p className="text-[10px] text-gray-500">{formatBytes(file.size)}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={resetWidget}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 h-8 w-8"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {status === "loading" && (
                        <div className="flex flex-col items-center justify-center p-3 gap-2">
                            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium animate-pulse">
                                Inteligência Artificial analisando extrato...
                            </p>
                            <span className="text-[10px] text-gray-400">Extraindo e categorizando transações</span>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-900/20 p-3 rounded-xl flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs font-bold">Importação Concluída!</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-tight">
                                Adicionamos <strong className="font-bold">{importedCount}</strong> transações do seu extrato no seu perfil.
                            </p>
                            {importedList.length > 0 && (
                                <details className="text-[10px] text-gray-400 dark:text-gray-500 cursor-pointer">
                                    <summary className="hover:text-gray-600 dark:hover:text-gray-300 select-none outline-none">
                                        Ver transações importadas
                                    </summary>
                                    <div className="max-h-[80px] overflow-y-auto mt-1 pl-2 border-l border-emerald-200 dark:border-emerald-900/40 space-y-0.5">
                                        {importedList.slice(0, 20).map((t, idx) => (
                                            <div key={idx} className="truncate">
                                                {t}
                                            </div>
                                        ))}
                                        {importedList.length > 20 && <div>...e mais {importedList.length - 20} itens.</div>}
                                    </div>
                                </details>
                            )}
                        </div>
                    )}

                    {status === "error" && (
                        <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100/20 dark:border-red-900/20 p-3 rounded-xl flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs font-bold">Falha no Processamento</span>
                            </div>
                            <p className="text-[11px] text-red-600 dark:text-red-300 leading-tight">
                                {message}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetWidget}
                                className="self-start text-[10px] h-7 px-2 border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                            >
                                Tentar novamente
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* CTA Action button if selected */}
            {status === "selected" && (
                <div className="flex gap-2 mt-4">
                    <Button
                        type="button"
                        onClick={handleImport}
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl h-10 font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                    >
                        Importar {file?.name.split(".").pop()?.toUpperCase()}
                    </Button>
                </div>
            )}
        </div>
    )
}
