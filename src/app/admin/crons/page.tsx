"use client";
import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Button } from "@/components/ui/atoms/button";
import { Play, Loader2, CheckCircle, XCircle, Cpu, Target, BarChart2, RefreshCw, Mail } from "lucide-react";

type CronId = "autonomous-agent" | "goal-tracker" | "finscore" | "recurring-detector" | "weekly-brief" | "daily-smart-digest";

interface RunResult { success: boolean; status: number; elapsedMs: number; result: any; }

const CRON_JOBS = [
    { id: "autonomous-agent"   as CronId, name: "Agente Autônomo",      desc: "Analisa desvios semanais de gasto e envia insights por push e e-mail para usuários ativos.",  icon: Cpu,        schedule: "Diário 06:00" },
    { id: "goal-tracker"       as CronId, name: "Rastreador de Metas",  desc: "Recalcula o progresso de todas as metas com base nas transações reais do mês.",              icon: Target,     schedule: "Diário 06:30" },
    { id: "finscore"           as CronId, name: "FinScore",             desc: "Calcula o score de saúde financeira (0–100) de todos os usuários e alerta quedas bruscas.",  icon: BarChart2,  schedule: "Diário 07:00" },
    { id: "recurring-detector" as CronId, name: "Detector Recorrentes", desc: "Detecta assinaturas fixas nos últimos 90 dias e as marca para excluir de alertas.",          icon: RefreshCw,  schedule: "Dia 1 do mês" },
    { id: "weekly-brief"       as CronId, name: "Resumo Semanal",       desc: "Gera um resumo financeiro semanal em linguagem natural via Gemini e envia por e-mail.",       icon: Mail,       schedule: "Dom 19:00"    },
    { id: "daily-smart-digest" as CronId, name: "Smart Digest",         desc: "Envia digest ou aviso de inatividade conforme o perfil de atividade de cada usuário.",        icon: Mail,       schedule: "Diário 09:00" },
];

export default function AdminCronsPage() {
    const [running, setRunning] = useState<CronId | null>(null);
    const [results, setResults] = useState<Record<string, RunResult>>({});

    const runCron = useCallback(async (cronId: CronId) => {
        setRunning(cronId);
        const start = Date.now();
        try {
            const res = await fetch("/api/admin/run-cron", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cron: cronId })
            });
            const data = await res.json().catch(() => ({}));
            setResults(prev => ({ ...prev, [cronId]: { success: res.ok && data.success !== false, status: res.status, elapsedMs: Date.now() - start, result: data } }));
        } catch (err: any) {
            setResults(prev => ({ ...prev, [cronId]: { success: false, status: 0, elapsedMs: Date.now() - start, result: { error: err.message } } }));
        } finally {
            setRunning(null);
        }
    }, []);

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-bold text-foreground">Cron Jobs</h1>
                <p className="text-sm text-muted-foreground mt-1">Execute qualquer job manualmente. Os resultados aparecem abaixo de cada card.</p>
            </div>

            <div className="space-y-3">
                {CRON_JOBS.map(({ id, name, desc, icon: Icon, schedule }) => {
                    const result = results[id];
                    const isRunning = running === id;

                    return (
                        <Card key={id} className="overflow-hidden">
                            <CardContent className="pt-4 pb-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-foreground">{name}</span>
                                                <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{schedule}</span>
                                                {result && (
                                                    result.success
                                                        ? <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        : <XCircle className="h-3.5 w-3.5 text-red-500" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                                            <p className="text-xs text-muted-foreground/50 mt-1 font-mono">/api/cron/{id}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={!!running}
                                        onClick={() => !running && runCron(id)}
                                    >
                                        {isRunning
                                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Executando</>
                                            : <><Play className="h-3.5 w-3.5 mr-1.5" />Executar</>
                                        }
                                    </Button>
                                </div>

                                {result && (
                                    <div className={`mt-3 rounded-lg border px-3 py-2.5 text-xs font-mono ${
                                        result.success
                                            ? "border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300"
                                            : "border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                                    }`}>
                                        <div className="flex justify-between mb-1">
                                            <span className="font-semibold">{result.success ? "Concluído" : "Falhou"} — HTTP {result.status}</span>
                                            <span className="text-muted-foreground">{result.elapsedMs}ms</span>
                                        </div>
                                        <pre className="whitespace-pre-wrap break-all max-h-24 overflow-auto text-inherit">
                                            {JSON.stringify(result.result, null, 2)}
                                        </pre>
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
