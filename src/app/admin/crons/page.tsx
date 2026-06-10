"use client";
import { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import {
    Play, Square, Loader2, CheckCircle, XCircle,
    Cpu, Target, BarChart2, RefreshCw, Mail
} from "lucide-react";

type CronId = "autonomous-agent" | "goal-tracker" | "finscore" | "recurring-detector" | "weekly-brief" | "daily-smart-digest";

interface BatchResult {
    running: boolean;
    autoRunning: boolean;
    processed: number;
    remaining: number | null;
    sent?: number;
    errors: number;
    lastElapsedMs: number;
    runCount: number;
    done: boolean;
    error?: string;
}

const CRON_JOBS = [
    { id: "autonomous-agent"   as CronId, name: "Agente Autônomo",      desc: "Analisa desvios semanais de gasto e envia insights por push e e-mail.",  icon: Cpu,       schedule: "Diário 06:00", batch: "3/run" },
    { id: "goal-tracker"       as CronId, name: "Rastreador de Metas",  desc: "Recalcula o progresso de todas as metas com base nas transações reais.", icon: Target,    schedule: "Diário 06:30", batch: "5/run" },
    { id: "finscore"           as CronId, name: "FinScore",             desc: "Calcula o score de saúde financeira (0–100) de todos os usuários.",       icon: BarChart2, schedule: "Diário 07:00", batch: "5/run" },
    { id: "recurring-detector" as CronId, name: "Detector Recorrentes", desc: "Detecta assinaturas fixas e as marca para excluir de alertas.",           icon: RefreshCw, schedule: "Dia 1 do mês",  batch: "5/run" },
    { id: "weekly-brief"       as CronId, name: "Resumo Semanal",       desc: "Gera resumo semanal via Gemini e envia por e-mail.",                       icon: Mail,      schedule: "Dom 19:00",     batch: "2/run" },
    { id: "daily-smart-digest" as CronId, name: "Smart Digest",         desc: "Envia digest ou aviso de inatividade por perfil de atividade.",            icon: Mail,      schedule: "Diário 09:00",  batch: "3/run" },
];

const EMPTY: BatchResult = {
    running: false, autoRunning: false, processed: 0,
    remaining: null, errors: 0, lastElapsedMs: 0, runCount: 0, done: false
};

export default function AdminCronsPage() {
    const [states, setStates] = useState<Record<string, BatchResult>>(
        Object.fromEntries(CRON_JOBS.map(j => [j.id, { ...EMPTY }]))
    );
    // Ref to store abort flags per cron
    const stopFlags = useRef<Record<string, boolean>>({});

    const setState = (id: CronId, patch: Partial<BatchResult>) =>
        setStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

    // ── Single batch call ────────────────────────────────────────────────────
    const callBatch = async (cronId: CronId, reset = false): Promise<{ remaining: number; result: any } | null> => {
        const res = await fetch("/api/admin/run-cron", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cron: cronId, reset }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
        return {
            remaining: data.result?.remaining ?? 0,
            result: data.result ?? {}
        };
    };

    // ── Auto-run loop: keep calling batches until done or stopped ────────────
    const startAutoRun = useCallback(async (cronId: CronId, reset = false) => {
        stopFlags.current[cronId] = false;

        setState(cronId, { running: true, autoRunning: true, done: false, error: undefined, processed: 0, errors: 0, runCount: 0, remaining: null });

        try {
            let totalProcessed = 0;
            let totalErrors = 0;
            let runCount = 0;
            let firstRun = true;

            while (true) {
                if (stopFlags.current[cronId]) break;

                const t = Date.now();
                let batchResult: { remaining: number; result: any } | null = null;

                try {
                    batchResult = await callBatch(cronId, firstRun && reset);
                    firstRun = false;
                } catch (err: any) {
                    setState(cronId, {
                        running: false, autoRunning: false,
                        error: err.message,
                        processed: totalProcessed,
                        errors: totalErrors + 1,
                        runCount,
                    });
                    return;
                }

                const elapsedMs = Date.now() - t;
                // batchResult is always set here — error path returns early above
                const br = batchResult!;
                const batchProcessed = br.result?.processed ?? 0;
                const batchErrors = br.result?.errors ?? 0;
                totalProcessed += batchProcessed;
                totalErrors += batchErrors;
                runCount++;

                setState(cronId, {
                    processed: totalProcessed,
                    remaining: br.remaining,
                    errors: totalErrors,
                    lastElapsedMs: elapsedMs,
                    runCount,
                    done: br.remaining === 0,
                });

                // Stop if done or no progress (safety)
                if (br.remaining === 0 || batchProcessed === 0) break;
                if (stopFlags.current[cronId]) break;

                // Small delay between batches to avoid hammering the server
                await new Promise(r => setTimeout(r, 500));
            }
        } finally {
            setStates(prev => ({
                ...prev,
                [cronId]: { ...prev[cronId], running: false, autoRunning: false }
            }));
        }
    }, []);

    const stopRun = (cronId: CronId) => {
        stopFlags.current[cronId] = true;
        setState(cronId, { autoRunning: false, running: false });
    };

    const resetRun = (cronId: CronId) => {
        stopFlags.current[cronId] = true;
        setState(cronId, { ...EMPTY });
    };

    return (
        <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-bold text-foreground">Cron Jobs</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Execução automática — processa todos os usuários em lotes sequenciais, sem timeout.
                </p>
            </div>

            <div className="space-y-3">
                {CRON_JOBS.map(({ id, name, desc, icon: Icon, schedule, batch }) => {
                    const s = states[id];

                    // Progress bar percentage
                    const total = s.remaining !== null ? s.processed + s.remaining : null;
                    const pct = total !== null && total > 0 ? Math.round((s.processed / total) * 100) : null;

                    return (
                        <Card key={id} className="overflow-hidden">
                            <CardContent className="pt-4 pb-4 space-y-3">
                                {/* Header row */}
                                <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-foreground">{name}</span>
                                                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{schedule}</span>
                                                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{batch}</span>
                                                {s.done && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                                                {s.error && <XCircle className="h-3.5 w-3.5 text-red-500" />}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                                        {(s.done || s.error || s.processed > 0) && !s.running && (
                                            <Button
                                                size="sm" variant="outline"
                                                className="text-xs h-8 px-2.5"
                                                onClick={() => resetRun(id)}
                                            >
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                Reset
                                            </Button>
                                        )}
                                        {s.running ? (
                                            <Button
                                                size="sm"
                                                className="h-8 bg-red-600 hover:bg-red-700 text-white"
                                                onClick={() => stopRun(id)}
                                            >
                                                <Square className="h-3.5 w-3.5 mr-1.5 fill-white" />
                                                Parar
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => startAutoRun(id)}
                                            >
                                                <Play className="h-3.5 w-3.5 mr-1.5" />
                                                Executar
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar + stats */}
                                {(s.running || s.processed > 0 || s.done) && (
                                    <div className="space-y-2">
                                        {/* Progress bar */}
                                        {pct !== null && (
                                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full transition-all duration-500 ${s.done ? "bg-green-500" : "bg-blue-500"}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        )}

                                        {/* Stats row */}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
                                            <div className="flex items-center gap-3">
                                                {s.running && (
                                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        Processando…
                                                    </span>
                                                )}
                                                {s.done && <span className="text-green-600 dark:text-green-400 font-medium">Concluído</span>}
                                                {s.error && <span className="text-red-600 dark:text-red-400 font-medium">Erro: {s.error}</span>}
                                                <span>{s.processed} processados</span>
                                                {s.remaining !== null && s.remaining > 0 && <span>{s.remaining} restantes</span>}
                                                {s.errors > 0 && <span className="text-red-500">{s.errors} erros</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {pct !== null && <span className="font-mono">{pct}%</span>}
                                                {s.lastElapsedMs > 0 && <span className="font-mono">{s.lastElapsedMs}ms/lote</span>}
                                                {s.runCount > 0 && <span>{s.runCount} lotes</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
