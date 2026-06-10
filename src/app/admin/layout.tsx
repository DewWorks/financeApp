"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Title } from "@/components/ui/molecules/Title";
import { Loader2, LayoutDashboard, Cpu, Terminal, ArrowLeft, ShieldCheck } from "lucide-react";

interface AdminUser {
    name: string;
    email: string;
    admin: boolean;
}

const NAV_ITEMS = [
    { href: "/admin",       label: "Visão Geral",  icon: LayoutDashboard },
    { href: "/admin/crons", label: "Cron Jobs",    icon: Cpu             },
    { href: "/admin/logs",  label: "Logs",         icon: Terminal        },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/users")
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data || !data.admin) {
                    router.replace("/");
                    return;
                }
                setUser(data);
            })
            .catch(() => router.replace("/"))
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background flex">

            {/* Sidebar */}
            <aside className="w-56 flex-shrink-0 bg-white dark:bg-card border-r border-border flex flex-col">
                {/* Logo */}
                <div className="h-14 flex items-center px-4 border-b border-border">
                    <Title size="sm" />
                </div>

                {/* Admin badge */}
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <ShieldCheck className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                <span className="text-xs text-blue-600 font-medium">Admin</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-3 space-y-0.5">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                            >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Back to dashboard */}
                <div className="px-2 pb-4 border-t border-border pt-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                        Dashboard
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
