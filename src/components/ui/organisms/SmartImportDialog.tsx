"use client"

import { useState, useRef } from "react"
import { 
    X, 
    UploadCloud, 
    FileText, 
    CheckCircle2, 
    AlertTriangle, 
    Loader2, 
    FileSpreadsheet 
} from "lucide-react"
import { Button } from "@/components/ui/atoms/button"

interface SmartImportDialogProps {
    isOpen: boolean
    onClose: () => void
    onRefresh?: () => Promise<void>
}

export function SmartImportDialog({ isOpen, onClose, onRefresh }: SmartImportDialogProps) {
    const [file, setFile] = useState<File | null>(null)
    const [isDragActive, setIsDragActive] = useState(false)
    const [importStatus, setImportStatus] = useState<"idle" | "selected" | "loading" | "success" | "error">("idle")
    const [importMessage, setImportMessage] = useState("")
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
                setImportStatus("selected")
                setImportMessage("")
            } else {
                setImportStatus("error")
                setImportMessage("Formato não suportado. Envie apenas PDF ou CSV.")
            }
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setImportStatus("selected")
            setImportMessage("")
        }
    }

    const handleButtonClick = () => {
        fileInputRef.current?.click()
    }

    const handleImport = async () => {
        if (!file) return

        setImportStatus("loading")
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
            setImportStatus("success")

            if (onRefresh) {
                await onRefresh()
            }
        } catch (error: any) {
            console.error("Import error:", error)
            setImportStatus("error")
            setImportMessage(error.message || "Falha no processamento. Verifique se o extrato é legível e compatível.")
        }
    }

    const resetWidget = () => {
        setFile(null)
        setImportStatus("idle")
        setImportMessage("")
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <UploadCloud className="w-5 h-5" />
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                            Importar Gastos (PDF/CSV)
                        </h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                    </button>
                </div>

                {/* Subtitle / Tip */}
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
                    Arraste a fatura do seu cartão ou o extrato mensal. A nossa IA vai higienizar as descrições e categorizar tudo em lote.
                </p>

                {/* File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.csv"
                    className="hidden"
                />

                {/* Dropzone Area */}
                <div className="min-h-[120px] flex flex-col justify-center">
                    {importStatus === "idle" && (
                        <div
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            onClick={handleButtonClick}
                            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                                isDragActive
                                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10"
                                    : "border-gray-200 dark:border-gray-700 hover:border-emerald-500/50 hover:bg-gray-50 dark:hover:bg-gray-900/30"
                            }`}
                        >
                            <UploadCloud className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-pulse" />
                            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                Clique para selecionar ou arraste o arquivo aqui
                            </p>
                            <span className="text-[9px] text-gray-400">PDF ou CSV (Nubank, Itaú, Inter, etc.)</span>
                        </div>
                    )}

                    {importStatus === "selected" && file && (
                        <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 p-3 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
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

                    {importStatus === "loading" && (
                        <div className="flex flex-col items-center justify-center p-4 gap-2 text-center">
                            <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
                            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium animate-pulse">
                                Inteligência Artificial processando extrato...
                            </p>
                            <span className="text-[10px] text-gray-400">Extraindo dados, categorizando e higienizando.</span>
                        </div>
                    )}

                    {importStatus === "success" && (
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-900/20 p-3 rounded-xl flex flex-col gap-2 animate-fade-in">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs font-bold">Importado com Sucesso!</span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-tight">
                                Carregamos **{importedCount}** transações no seu perfil.
                            </p>
                            {importedList.length > 0 && (
                                <details className="text-[10px] text-gray-400 dark:text-gray-500 cursor-pointer">
                                    <summary className="hover:text-gray-600 dark:hover:text-gray-300 select-none outline-none">
                                        Ver itens processados
                                    </summary>
                                    <div className="max-h-[80px] overflow-y-auto mt-1 pl-2 border-l border-emerald-200 dark:border-emerald-900/40 space-y-0.5">
                                        {importedList.slice(0, 20).map((t, idx) => (
                                            <div key={idx} className="truncate">
                                                {t}
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}
                        </div>
                    )}

                    {importStatus === "error" && (
                        <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100/20 dark:border-red-900/20 p-3 rounded-xl flex flex-col gap-2 animate-fade-in">
                            <div className="flex items-center gap-2 text-red-500 dark:text-red-400">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span className="text-xs font-bold">Erro de Processamento</span>
                            </div>
                            <p className="text-[11px] text-red-600 dark:text-red-300 leading-tight">
                                {importMessage}
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

                {/* Import Confirmation Footer */}
                {importStatus === "selected" && (
                    <div className="flex gap-2 justify-end pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-xs text-gray-500"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={handleImport}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 font-bold text-xs shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                        >
                            Confirmar Importação
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
