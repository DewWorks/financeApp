"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { Cpu, Target, BarChart2, RefreshCw, Mail, Terminal, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";

const SECTIONS = [
    {
        href: "/admin/crons",
        title: "Cron Jobs",
        description: "Execute e monitore os agentes autônomos manualmente: insights, metas, FinScore e resumos semanais.",
        icon: Cpu,
        stat: "6 jobs configurados",
    },
    {
        href: "/admin/logs",
        title: "Logs do Sistema",
        description: "Acompanhe em tempo real todas as operações do sistema, erros e notificações enviadas.",
        icon: Terminal,
        stat: "Stream ao vivo",
    },
];

const CRON_LIST = [
    { label: "Agente Autônomo",     schedule: "Diário 06:00", icon: Cpu },
    { label: "Rastreador de Metas", schedule: "Diário 06:30", icon: Target },
    { label: "FinScore",            schedule: "Diário 07:00", icon: BarChart2 },
    { label: "Detector Recorrentes",schedule: "Dia 1 do mês", icon: RefreshCw },
    { label: "Resumo Semanal",      schedule: "Dom 19:00",    icon: Mail },
    { label: "Smart Digest",        schedule: "Diário 09:00", icon: Mail },
];

export default function AdminHomePage() {
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [now, setNow] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("user_data");
        if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
        else {
            fetch("/api/users").then(r => r.json()).then(d => setUser(d)).catch(() => {});
        }
        setNow(new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short" }));
    }, []);

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">

            {/* Welcome */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Área Administrativa</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                    Olá, {user?.name?.split(" ")[0] || "Admin"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{now}</p>
            </div>

            {/* Identity card */}
            <Card>
                <CardContent className="pt-5 pb-5">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                            {user?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{user?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                    <ShieldCheck className="h-3 w-3" />
                                    Administrador
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Section cards */}
            <div>
                <h2 className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Seções Disponíveis</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SECTIONS.map(({ href, title, description, icon: Icon, stat }) => (
                        <Link key={href} href={href}>
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                                <CardContent className="pt-5 pb-5">
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/60 transition-colors">
                                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{title}</p>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">{stat}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Cron schedule overview */}
            <div>
                <h2 className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Agendamento Ativo</h2>
                <Card>
                    <CardContent className="pt-4 pb-2">
                        <div className="divide-y divide-border">
                            {CRON_LIST.map(({ label, schedule, icon: Icon }) => (
                                <div key={label} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-2.5">
                                        <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                        <span className="text-sm text-foreground">{label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                        <span className="text-xs text-muted-foreground font-mono">{schedule}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    );
}
