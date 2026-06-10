"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Title } from "@/components/ui/molecules/Title";
import { Loader2, LayoutDashboard, Cpu, Terminal, ArrowLeft, ShieldCheck, Menu, X } from "lucide-react";

interface AdminUser { name: string; email: string; admin: boolean; }

const NAV_ITEMS = [
    { href: "/admin",       label: "Visão Geral", icon: LayoutDashboard },
    { href: "/admin/crons", label: "Cron Jobs",   icon: Cpu             },
    { href: "/admin/logs",  label: "Logs",        icon: Terminal        },
];

// ─── Sidebar content (shared between desktop and mobile drawer) ───────────────
function SidebarContent({
    user,
    pathname,
    onNavigate,
}: {
    user: AdminUser;
    pathname: string;
    onNavigate?: () => void;
}) {
    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-14 flex items-center px-4 border-b border-border flex-shrink-0">
                <Title size="sm" />
            </div>

            {/* Admin badge */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="h-3 w-3 text-blue-600 flex-shrink-0" />
                            <span className="text-xs text-blue-600 font-medium">Admin</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onNavigate}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
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
            <div className="px-2 pb-4 border-t border-border pt-3 flex-shrink-0">
                <Link
                    href="/"
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                    Dashboard
                </Link>
            </div>
        </div>
    );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close drawer on route change
    useEffect(() => { setDrawerOpen(false); }, [pathname]);

    useEffect(() => {
        fetch("/api/users")
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data?.admin) { router.replace("/"); return; }
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

            {/* ── Desktop sidebar (hidden on mobile) ── */}
            <aside className="hidden md:flex w-56 flex-shrink-0 bg-white dark:bg-card border-r border-border flex-col">
                <SidebarContent user={user} pathname={pathname} />
            </aside>

            {/* ── Mobile: top bar + drawer ── */}
            {/* Top bar (mobile only) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-card border-b border-border flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Abrir menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <Title size="sm" />
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {user.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                </div>
            </div>

            {/* Overlay */}
            {drawerOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* Drawer */}
            <div className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-card border-r border-border transform transition-transform duration-300 ease-in-out ${
                drawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
                <div className="absolute top-3 right-3">
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Fechar menu"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <SidebarContent user={user} pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </div>

            {/* ── Main content ── */}
            <main className="flex-1 overflow-auto md:ml-0 pt-14 md:pt-0">
                {children}
            </main>
        </div>
    );
}
