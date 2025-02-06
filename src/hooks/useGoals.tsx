import { useState, useEffect, useCallback } from 'react'
import { IGoal } from '@/interfaces/IGoal'

export function useGoals() {
    const [goals, setGoals] = useState<IGoal[]>([])
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning'| 'auth' } | null>(null)

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'auth') => {
        setToast({ message, type })
    }

    const fetchGoals = useCallback(async () => {
        try {
            const response = await fetch('/api/goals');
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) {
                    setGoals(data);
                } else {
                    console.error('Data fetched is not an array:', data);
                    setGoals([]);
                }
            } else if (response.status === 401) {
                showToast('Erro de autenticação', 'auth');
            } else {
                console.error('Failed to fetch goals');
                showToast('Falha ao carregar metas. Por favor, tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Error fetching goals:', error);
            setGoals([]);
            showToast('Ocorreu um erro ao carregar as metas. Por favor, tente novamente.', 'error');
        }
    }, []);

    useEffect(() => {
        fetchGoals()
    }, [fetchGoals])

    const addGoal = async (goal: Partial<IGoal>) => {
        try {
            showToast('Adicionando meta...', 'warning');
            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(goal)
            })
            if (response.ok) {
                await fetchGoals()
                showToast('Meta adicionada com sucesso!', 'success');
            } else if (response.status === 401) {
                showToast('Erro de autenticação', 'auth');
            } else {
                const errorData = await response.json()
                console.error('Failed to add goal:', errorData.error)
                showToast('Falha ao adicionar meta. Por favor, tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Error adding goal:', error)
            showToast('Ocorreu um erro ao adicionar a meta. Por favor, tente novamente.', 'error');
        }
    }

    const editGoal = async (updatedGoal: Partial<IGoal>) => {
        try {
            showToast('Editando meta...', 'warning');
            const response = await fetch(`/api/goals/${updatedGoal._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedGoal)
            })

            if (response.ok) {
                await fetchGoals()
                showToast('Meta atualizada com sucesso!', 'success');
            } else if (response.status === 401) {
                showToast('Erro de autenticação', 'auth');
            } else {
                const errorData = await response.json()
                console.error('Failed to edit goal:', errorData.error)
                showToast('Falha ao atualizar meta. Por favor, tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Error editing goal:', error)
            showToast('Ocorreu um erro ao atualizar a meta. Por favor, tente novamente.', 'error');
        }
    }

    const deleteGoal = async (goalId: string) => {
        try {
            showToast('Excluindo meta...', 'warning');
            const response = await fetch(`/api/goals/${goalId}`, {
                method: 'DELETE',
            })
            if (response.ok) {
                await fetchGoals()
                showToast('A meta foi excluída com sucesso.', 'success');
            } else if (response.status === 401) {
                showToast('Erro de autenticação', 'auth');
            } else {
                const errorData = await response.json()
                console.error('Failed to delete goal:', errorData.error)
                showToast('Falha ao excluir meta. Por favor, tente novamente.', 'error');
            }
        } catch (error) {
            console.error('Error deleting goal:', error)
            showToast('Ocorreu um erro ao excluir a meta. Por favor, tente novamente.', 'error');
        }
    }

    const getGoal = async (goalId: string): Promise<IGoal | null> => {
        try {
            const response = await fetch(`/api/goals/${goalId}`)
            if (response.ok) {
                return await response.json()
            } else if (response.status === 401) {
                showToast('Erro de autenticação', 'auth');
                return null;
            } else {
                console.error('Failed to get goal')
                showToast('Falha ao obter detalhes da meta. Por favor, tente novamente.', 'error');
                return null
            }
        } catch (error) {
            console.error('Error getting goal:', error)
            showToast('Ocorreu um erro ao obter detalhes da meta. Por favor, tente novamente.', 'error');
            return null
        }
    }

    return {
        goals,
        addGoal,
        editGoal,
        deleteGoal,
        getGoal,
        toast,
        showToast
    }
}
