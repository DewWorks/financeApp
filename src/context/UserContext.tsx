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
            // Fallback to localStorage logic from current app implementation
            // Ideally should be a /me endpoint using cookies
            const userId = localStorage.getItem("user-id");
            if (!userId) {
                setUser(null);
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/admin/users/${userId}`);
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
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

    // Derive plan safely
    const currentPlan = (user?.subscription?.plan as PlanType) || PlanType.FREE;

    return (
        <UserContext.Provider value={{ user, currentPlan, loading, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
