"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { UpgradeModal } from "@/components/ui/organisms/UpgradeModal";
import { PlanType } from "@/interfaces/IUser";
import { useUser } from "@/context/UserContext";

interface PlanGateContextType {
    currentPlan: PlanType;
    openUpgradeModal: (message?: string, requiredPlan?: 'PRO' | 'MAX') => void;
    checkFeature: (feature: 'UNLIMITED_TRANSACTIONS' | 'WHATSAPP' | 'OPEN_FINANCE' | 'DEEP_INSIGHTS') => boolean;
}

const PlanGateContext = createContext<PlanGateContextType | undefined>(undefined);

export function PlanGateProvider({ children }: { children: ReactNode }) {
    const { currentPlan } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState<string | undefined>(undefined);
    const [requiredPlan, setRequiredPlan] = useState<'PRO' | 'MAX'>('PRO');

    const openUpgradeModal = (message?: string, plan: 'PRO' | 'MAX' = 'PRO') => {
        setModalMessage(message);
        setRequiredPlan(plan);
        setIsModalOpen(true);
    };

    const checkFeature = (feature: 'UNLIMITED_TRANSACTIONS' | 'WHATSAPP' | 'OPEN_FINANCE' | 'DEEP_INSIGHTS'): boolean => {
        // Simple client-side check to update UI state (buttons enabled/disabled)
        // Actual security is on backend
        const planLevels = { [PlanType.FREE]: 0, [PlanType.PRO]: 1, [PlanType.MAX]: 2 };
        const level = planLevels[currentPlan];

        switch (feature) {
            case 'UNLIMITED_TRANSACTIONS': return level >= 1;
            case 'WHATSAPP': return level >= 1;
            case 'OPEN_FINANCE': return level >= 2;
            case 'DEEP_INSIGHTS': return level >= 2;
            default: return false;
        }
    };

    return (
        <PlanGateContext.Provider value={{ currentPlan, openUpgradeModal, checkFeature }}>
            {children}
            <UpgradeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                message={modalMessage}
                requiredPlan={requiredPlan}
            />
        </PlanGateContext.Provider>
    );
}

export function usePlanGate() {
    const context = useContext(PlanGateContext);
    if (context === undefined) {
        throw new Error("usePlanGate must be used within a PlanGateProvider");
    }
    return context;
}
