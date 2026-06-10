"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/atoms/card";

type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";
interface LogEntry { id: string; level: LogLevel; context: string; message: string; timestamp: string; }

const LEVEL_STYLES: Record<LogLevel, string> = {
    INFO:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    WARN:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
    ERROR:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    SUCCESS: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [connected, setConnected] = useState(false);
    const [filter, setFilter] = useState<LogLevel | "ALL">("ALL");
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const es = new EventSource("/api/admin/logs/stream");
        es.onopen = () => setConnected(true);
        es.onerror = () => setConnected(false);
        es.onmessage = (e) => {
            try {
                const d = JSON.parse(e.data);
                if (d.level) setLogs(prev => [...prev.slice(-499), d]);
            } catch {}
        };
        return () => { es.close(); setConnected(false); };
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const visible = filter === "ALL" ? logs : logs.filter(l => l.level === filter);

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Logs do Sistema</h1>
                    <p className="text-sm text-muted-foreground mt-1">Monitoramento em tempo real de todas as operações.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                        connected
                            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                            : "border-border bg-muted text-muted-foreground"
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
                        {connected ? "Ao vivo" : "Desconectado"}
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {(["ALL", "INFO", "SUCCESS", "WARN", "ERROR"] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                            filter === f
                                ? "bg-foreground text-background border-foreground"
                                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                        {f}
                    </button>
                ))}
                <button
                    onClick={() => setLogs([])}
                    className="ml-auto px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
                >
                    Limpar
                </button>
            </div>

            {/* Log area */}
            <Card>
                <CardContent className="p-0">
                    <div
                        className="overflow-y-auto rounded-xl"
                        style={{ height: "calc(100vh - 300px)", minHeight: 360 }}
                    >
                        {visible.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                {connected ? "Aguardando eventos do sistema…" : "Conectando…"}
                            </div>
                        ) : (
                            <table className="w-full text-xs font-mono">
                                <thead className="sticky top-0 bg-muted border-b border-border">
                                    <tr>
                                        <th className="text-left px-4 py-2 text-muted-foreground font-medium w-24">Hora</th>
                                        <th className="text-left px-3 py-2 text-muted-foreground font-medium w-20">Nível</th>
                                        <th className="text-left px-3 py-2 text-muted-foreground font-medium w-32">Contexto</th>
                                        <th className="text-left px-3 py-2 text-muted-foreground font-medium">Mensagem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {visible.map(log => {
                                        const time = new Date(log.timestamp).toLocaleTimeString("pt-BR");
                                        return (
                                            <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                                                <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{time}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${LEVEL_STYLES[log.level]}`}>
                                                        {log.level}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground truncate max-w-[128px]">{log.context}</td>
                                                <td className={`px-3 py-2 break-words ${log.level === "ERROR" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                                                    {log.message}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        <div ref={bottomRef} />
                    </div>
                    <div className="border-t border-border px-4 py-2 flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{visible.length} entradas</span>
                        <button
                            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Ir para o fim
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
