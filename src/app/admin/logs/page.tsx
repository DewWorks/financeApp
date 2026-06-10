"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Loader2 } from "lucide-react";

type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";
interface LogEntry { id: string; level: LogLevel; context: string; message: string; timestamp: string; }

const POLL_INTERVAL_MS = 3000;

const LEVEL_STYLES: Record<LogLevel, { badge: string; row: string }> = {
    INFO:    { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",    row: "" },
    WARN:    { badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", row: "bg-yellow-50/30 dark:bg-yellow-900/5" },
    ERROR:   { badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",        row: "bg-red-50/40 dark:bg-red-900/10" },
    SUCCESS: { badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", row: "" },
};

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<LogLevel | "ALL">("ALL");
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(true);
    const [newCount, setNewCount] = useState(0); // new logs since last render
    const lastTimestampRef = useRef<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const autoScrollRef = useRef(true);
    const tableRef = useRef<HTMLDivElement>(null);

    // ── Initial load ─────────────────────────────────────────────────────────
    const loadInitial = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/logs?limit=200");
            if (!res.ok) return;
            const data = await res.json();
            const entries: LogEntry[] = data.logs ?? [];
            setLogs(entries);
            if (entries.length > 0) {
                lastTimestampRef.current = entries[entries.length - 1].timestamp;
            }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    // ── Poll for new entries ──────────────────────────────────────────────────
    const pollNew = useCallback(async () => {
        if (!polling) return;
        try {
            const since = lastTimestampRef.current
                ? `?since=${encodeURIComponent(lastTimestampRef.current)}&limit=100`
                : "?limit=50";
            const res = await fetch(`/api/admin/logs${since}`);
            if (!res.ok) return;
            const data = await res.json();
            const newEntries: LogEntry[] = data.logs ?? [];
            if (newEntries.length > 0) {
                setLogs(prev => {
                    // Deduplicate by id
                    const existingIds = new Set(prev.map(l => l.id));
                    const fresh = newEntries.filter(l => !existingIds.has(l.id));
                    if (fresh.length === 0) return prev;
                    setNewCount(c => c + fresh.length);
                    return [...prev.slice(-499), ...fresh]; // cap at 500
                });
                lastTimestampRef.current = newEntries[newEntries.length - 1].timestamp;
            }
        } catch { /* ignore */ }
    }, [polling]);

    useEffect(() => { loadInitial(); }, [loadInitial]);

    // Polling interval
    useEffect(() => {
        if (!polling) return;
        const id = setInterval(pollNew, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [polling, pollNew]);

    // Auto-scroll when new logs arrive
    useEffect(() => {
        if (autoScrollRef.current && newCount > 0) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            setNewCount(0);
        }
    }, [logs, newCount]);

    // Detect manual scroll — disable autoscroll if user scrolled up
    const handleScroll = () => {
        const el = tableRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        autoScrollRef.current = atBottom;
    };

    const visible = filter === "ALL" ? logs : logs.filter(l => l.level === filter);

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Logs do Sistema</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Atualização automática a cada {POLL_INTERVAL_MS / 1000}s.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                        polling
                            ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                            : "border-border bg-muted text-muted-foreground"
                    }`}>
                        {polling
                            ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Ao vivo</>
                            : <><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />Pausado</>
                        }
                    </span>
                    <button
                        onClick={() => setPolling(p => !p)}
                        className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        {polling ? "Pausar" : "Retomar"}
                    </button>
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
                        {f !== "ALL" && (
                            <span className="ml-1.5 opacity-60">
                                {logs.filter(l => l.level === f).length}
                            </span>
                        )}
                    </button>
                ))}
                <button
                    onClick={() => { setLogs([]); lastTimestampRef.current = null; loadInitial(); }}
                    className="ml-auto text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                    Recarregar
                </button>
                <button
                    onClick={() => setLogs([])}
                    className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-muted transition-colors"
                >
                    Limpar
                </button>
            </div>

            {/* Log table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-muted-foreground gap-2 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Carregando logs…
                        </div>
                    ) : (
                        <div
                            ref={tableRef}
                            onScroll={handleScroll}
                            className="overflow-y-auto rounded-xl"
                            style={{ height: "calc(100vh - 310px)", minHeight: 360 }}
                        >
                            {visible.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    Nenhum log encontrado.
                                </div>
                            ) : (
                                <table className="w-full text-xs font-mono">
                                    <thead className="sticky top-0 bg-muted border-b border-border z-10">
                                        <tr>
                                            <th className="text-left px-4 py-2 text-muted-foreground font-medium w-20">Hora</th>
                                            <th className="text-left px-3 py-2 text-muted-foreground font-medium w-20">Nível</th>
                                            <th className="text-left px-3 py-2 text-muted-foreground font-medium w-32 hidden sm:table-cell">Contexto</th>
                                            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Mensagem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {visible.map(log => {
                                            const s = LEVEL_STYLES[log.level] ?? LEVEL_STYLES.INFO;
                                            const time = new Date(log.timestamp).toLocaleTimeString("pt-BR");
                                            return (
                                                <tr key={log.id} className={`hover:bg-muted/40 transition-colors ${s.row}`}>
                                                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{time}</td>
                                                    <td className="px-3 py-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${s.badge}`}>
                                                            {log.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[128px] hidden sm:table-cell">
                                                        {log.context}
                                                    </td>
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
                    )}

                    {/* Footer */}
                    <div className="border-t border-border px-4 py-2 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{visible.length} entradas</span>
                            {!autoScrollRef.current && (
                                <button
                                    onClick={() => { autoScrollRef.current = true; bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Ir para o fim
                                </button>
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                            Próxima atualização em {POLL_INTERVAL_MS / 1000}s
                        </span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
