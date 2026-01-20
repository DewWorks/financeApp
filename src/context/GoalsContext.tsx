"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { IGoal } from '@/interfaces/IGoal';
import axios from 'axios';

interface GoalsContextType {
    goals: IGoal[];
    addGoal: (goal: Partial<IGoal>) => Promise<void>;
    editGoal: (updatedGoal: Partial<IGoal>) => Promise<void>;
    deleteGoal: (goalId: string) => Promise<void>;
    getGoal: (goalId: string) => Promise<IGoal | null>;
    toast: { message: string; type: 'success' | 'error' | 'warning' | 'auth' } | null;
    showToast: (message: string, type: 'success' | 'error' | 'warning' | 'auth') => void;
}

export const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: ReactNode }) {
    const [goals, setGoals] = useState<IGoal[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'auth' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'auth') => {
        setToast({ message, type });
    };

    const fetchGoals = useCallback(async () => {
        try {
            const response = await axios.get('/api/goals');
            const data = response.data;

            if (Array.isArray(data)) {
                setGoals(data);
            } else {
                console.error('Data fetched is not an array:', data);
                setGoals([]);
            }
        } catch (error) {
            console.error('Error fetching goals:', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                showToast('Erro de autenticação', 'auth');
            } else {
                // To avoid spamming on initial load if something minor fails, or keep as is.
                // showToast('Falha ao carregar metas. Por favor, tente novamente.', 'error');
            }
            // setGoals([]); // Don't clear if it was temporary network glitch? But logic says safety.
            setGoals([]);
        }
    }, []);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const addGoal = async (goal: Partial<IGoal>) => {
        try {
            showToast('Adicionando meta...', 'warning');
            const response = await axios.post('/api/goals', goal);

            if (response.status >= 200 && response.status < 300) {
                await fetchGoals();
                showToast('Meta adicionada com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Error adding goal:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    showToast('Erro de autenticação', 'auth');
                } else {
                    const errorMsg = error.response?.data?.error || 'Falha desconhecida';
                    console.error('Failed to add goal:', errorMsg);
                    showToast('Falha ao adicionar meta. Por favor, tente novamente.', 'error');
                }
            } else {
                showToast('Ocorreu um erro ao adicionar a meta. Por favor, tente novamente.', 'error');
            }
        }
    };

    const editGoal = async (updatedGoal: Partial<IGoal>) => {
        try {
            showToast('Editando meta...', 'warning');
            const response = await axios.put(`/api/goals/${updatedGoal._id}`, updatedGoal);

            if (response.status >= 200 && response.status < 300) {
                await fetchGoals();
                showToast('Meta atualizada com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Error editing goal:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    showToast('Erro de autenticação', 'auth');
                } else {
                    const errorMsg = error.response?.data?.error || 'Falha desconhecida';
                    console.error('Failed to edit goal:', errorMsg);
                    showToast('Falha ao atualizar meta. Por favor, tente novamente.', 'error');
                }
            } else {
                showToast('Ocorreu um erro ao atualizar a meta. Por favor, tente novamente.', 'error');
            }
        }
    };

    const deleteGoal = async (goalId: string) => {
        try {
            showToast('Excluindo meta...', 'warning');
            const response = await axios.delete(`/api/goals/${goalId}`);

            if (response.status >= 200 && response.status < 300) {
                await fetchGoals();
                showToast('A meta foi excluída com sucesso.', 'success');
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    showToast('Erro de autenticação', 'auth');
                } else {
                    const errorMsg = error.response?.data?.error || 'Falha desconhecida';
                    console.error('Failed to delete goal:', errorMsg);
                    showToast('Falha ao excluir meta. Por favor, tente novamente.', 'error');
                }
            } else {
                showToast('Ocorreu um erro ao excluir a meta. Por favor, tente novamente.', 'error');
            }
        }
    };

    const getGoal = async (goalId: string): Promise<IGoal | null> => {
        try {
            const response = await axios.get(`/api/goals/${goalId}`);
            if (response.status >= 200 && response.status < 300) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Error getting goal:', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                showToast('Erro de autenticação', 'auth');
                return null;
            }
            showToast('Falha ao obter detalhes da meta. Por favor, tente novamente.', 'error');
            return null;
        }
    };

    return (
        <GoalsContext.Provider
            value={{
                goals,
                addGoal,
                editGoal,
                deleteGoal,
                getGoal,
                toast,
                showToast
            }}
        >
            {children}
        </GoalsContext.Provider>
    );
}

export function useGoals() {
    const context = useContext(GoalsContext);
    if (context === undefined) {
        throw new Error("useGoals must be used within a GoalsProvider");
    }
    return context;
}
