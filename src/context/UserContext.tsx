"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { IUser } from "@/interfaces/IUser";
import { PlanType } from "@/interfaces/IUser";

interface UserContextType {
    user: IUser | null;
    currentPlan: PlanType;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            setLoading(true);
            // Try fetching from standard authenticated endpoint (cookies)
            const response = await fetch(`/api/users`, {
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-store' // Disable caching to prevent stale 401s
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                // Sync localStorage for legacy checks if needed
                if (userData._id) {
                    localStorage.setItem("user-id", userData._id);
                }
            } else {
                // If 401, we might try localStorage fallback or just clear
                // Ideally, if /api/users fails (401), we are logged out.
                console.warn("User auth check failed:", response.status);
                setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    // Derive plan safely (Admins get MAX features)
    const currentPlan = (user?.admin ? PlanType.MAX : (user?.subscription?.plan as PlanType)) || PlanType.FREE;

    return (
        <UserContext.Provider value={{ user, currentPlan, loading, refreshUser }}>
            {children}
            <TermsCheck user={user} refreshUser={refreshUser} />
        </UserContext.Provider>
    );
}

function TermsCheck({ user, refreshUser }: { user: IUser | null, refreshUser: () => Promise<void> }) {
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (!user) return;
        if (checked) return; // Prevent loop if already checked/accepted in session

        // Check verification (undefined or false means not accepted)
        // Compatibility: Check nested first, fallback to flat if migrating (optional, but clean schema wins)
        if (!user.terms?.accepted) {
            import("sweetalert2").then((Swal) => {
                Swal.default.fire({
                    title: 'Atualização de Termos',
                    html: `
                        <div class="text-left">
                            <p class="mb-4">Para continuar usando o FinanceApp, você precisa aceitar nossos novos Termos de Uso.</p>
                            <p class="text-sm text-gray-500 mb-4">Atualizamos nossa política para garantir mais segurança e transparência com seus dados bancários e o uso de Inteligência Artificial.</p>
                            <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <input type="checkbox" id="swal-terms" class="w-4 h-4 text-blue-600 rounded">
                                <label for="swal-terms" class="text-sm font-medium cursor-pointer">
                                    Li e concordo com os <a href="/terms" target="_blank" class="text-blue-600 hover:underline">Termos de Uso</a>
                                </label>
                            </div>
                        </div>
                    `,
                    icon: 'info',
                    confirmButtonText: 'Aceitar e Continuar',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showClass: { popup: '' }, // Disable animation loop issues
                    preConfirm: () => {
                        const accepted = (Swal.default.getHtmlContainer()?.querySelector('#swal-terms') as HTMLInputElement)?.checked;
                        if (!accepted) {
                            Swal.default.showValidationMessage('Você precisa marcar a caixa para concordar.');
                            return false;
                        }
                        return true;
                    }
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const res = await fetch('/api/user/accept-terms', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: user._id })
                            });

                            if (res.ok) {
                                await refreshUser();
                                setChecked(true);
                                Swal.default.fire('Obrigado!', 'Termos aceitos com sucesso.', 'success');
                            } else {
                                Swal.default.fire('Erro', 'Houve um problema ao salvar. Tente novamente.', 'error');
                            }
                        } catch (e) {
                            console.error(e);
                            Swal.default.fire('Erro', 'Erro de conexão.', 'error');
                        }
                    }
                });
            });
        }
    }, [user, checked]);

    return null;
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
