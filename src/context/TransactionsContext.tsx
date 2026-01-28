"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { ITransaction } from "@/interfaces/ITransaction";
import { useRouter } from "next/navigation";
import axios from "axios";
import { usePlanGate } from "@/context/PlanGateContext";

interface TransactionsContextType {
    transactions: ITransaction[];
    allTransactions: ITransaction[];
    chartData: ITransaction[];
    setTransactions: React.Dispatch<React.SetStateAction<ITransaction[]>>;
    getAllTransactions: () => Promise<void>;
    getAllTransactionsPage: (page?: number) => Promise<void>;
    isAllTransactions: boolean;
    setIsAllTransactions: React.Dispatch<React.SetStateAction<boolean>>;
    setAllTransactions: React.Dispatch<React.SetStateAction<ITransaction[]>>; // Add interface definition
    getTransactions: (page?: number) => Promise<void>;
    addTransaction: (transaction: Partial<ITransaction>) => Promise<void>;
    editTransaction: (updatedTransaction: Partial<ITransaction>) => Promise<void>;
    deleteTransaction: (transactionId: string) => Promise<void>;
    getTransaction: (transactionId: string) => Promise<ITransaction | null>;
    toast: { message: string; type: 'success' | 'error' | 'warning' | 'auth' } | null;
    setToast: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' | 'warning' | 'auth' } | null>>;
    currentPage: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
    handlePreviousPage: () => void;
    handleNextPage: () => void;
    filterTransactionsByMonth: (month: number | null) => void;
    selectedMonth: number | null;
    loading: boolean;
    summaryData: { income: number; expense: number; balance: number };
    getChartData: () => Promise<void>;
    getSummary: () => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children, profileId }: { children: ReactNode, profileId?: string | null }) {
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [allTransactions, setAllTransactions] = useState<ITransaction[]>([]);
    const [chartData, setChartData] = useState<ITransaction[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'auth' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Optimization: Initialize with current month to avoid null -> value flip causing double fetch
    const [selectedMonth, setSelectedMonth] = useState<number | null>(() => new Date().getMonth() + 1);

    const [isAllTransactions, setIsAllTransactions] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [summaryData, setSummaryData] = useState<{ income: number; expense: number; balance: number }>({ income: 0, expense: 0, balance: 0 });

    const router = useRouter();
    const { openUpgradeModal } = usePlanGate();

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'auth') => {
        setToast({ message, type });
    };

    const getChartData = useCallback(async () => {
        try {
            let url = `/api/transactions?limit=1000`;
            if (selectedMonth) {
                url += `&month=${selectedMonth}`;
            } else {
                const currentMonth = new Date().getMonth() + 1;
                url += `&month=${currentMonth}`;
            }
            // Note if API supports filtering by profileId for charts, append here.
            if (profileId) {
                // Assuming API might ignore it for now, but good practice if we add it later
                url += `&profileId=${profileId}`;
            }

            const response = await axios.get(url);
            const data = response.data;

            if (Array.isArray(data.transactions)) {
                setChartData(data.transactions);
            }
        } catch (error) {
            console.error('Error fetching chart data:', error);
        }
    }, [selectedMonth, profileId]);

    const getAllTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/transactions/all');
            const data = response.data;

            if (Array.isArray(data)) {
                setAllTransactions(data);
            } else {
                console.error('Erro: resposta inesperada', data);
                showToast('Erro ao carregar transações.', 'error');
            }
        } catch (error) {
            console.error('Erro ao buscar todas as transações:', error);
            showToast('Erro ao carregar todas as transações.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const getTransactions = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/transactions`, {
                params: {
                    page,
                    limit: 10,
                    month: selectedMonth,
                    profileId: profileId // Pass profileId even if API currently ignores it (future proofing)
                }
            });

            const data = response.data;

            if (Array.isArray(data.transactions)) {
                setTransactions(data.transactions);
                setTotalPages(data.totalPages || 1);
            } else {
                console.error("Erro: resposta inesperada", data);
                showToast("Erro ao carregar transações.", "error");
                router.push("/auth/login");
            }
        } catch (error) {
            console.error("Erro ao buscar transações:", error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                showToast("Sessão expirada. Redirecionando para login...", "warning");
                router.push("/auth/login");
                return;
            }
            showToast("Falha ao carregar transações.", "error");
            router.push("/auth/login");
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, router, profileId]);

    const getAllTransactionsPage = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            showToast("Buscando transações paginadas.", "warning");
            const response = await axios.get(`/api/transactions/all/page`, {
                params: {
                    page,
                    limit: 10,
                    profileId // Future proofing
                }
            });

            const data = response.data;

            if (Array.isArray(data.transactions)) {
                setTransactions(data.transactions);
                setTotalPages(data.totalPages || 1);
                showToast("Transações buscadas!", "success");
            } else {
                console.error("Erro: resposta inesperada", data);
                showToast("Erro ao carregar transações paginadas.", "success");
            }
        } catch (error) {
            console.error("Erro ao buscar transações paginadas:", error);
            showToast("Falha ao carregar transações paginadas.", "error");
        } finally {
            setLoading(false);
        }
    }, [profileId]);

    const getSummary = useCallback(async () => {
        try {
            let url = '/api/transactions/summary';
            const params: any = {};

            if (selectedMonth) {
                params.month = selectedMonth;
                params.year = new Date().getFullYear();
            } else if (!isAllTransactions) {
                const currentMonth = new Date().getMonth() + 1;
                params.month = currentMonth;
                params.year = new Date().getFullYear();
            }

            if (profileId) {
                params.profileId = profileId;
            }

            const response = await axios.get(url, { params });
            setSummaryData(response.data);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    }, [selectedMonth, isAllTransactions, profileId]);

    // Initial Fetch Effect
    useEffect(() => {
        getChartData();
    }, [getChartData]);

    useEffect(() => {
        getSummary();
    }, [getSummary]);

    // Centralized fetch logic trigger
    useEffect(() => {
        if (!isAllTransactions) {
            getTransactions(currentPage);
        }
    }, [currentPage, selectedMonth, isAllTransactions, getTransactions, profileId]);

    useEffect(() => {
        if (isAllTransactions) {
            getAllTransactionsPage(currentPage);
        }
    }, [isAllTransactions, currentPage, getAllTransactionsPage, profileId]);

    const addTransaction = async (transaction: Partial<ITransaction>) => {
        try {
            showToast("Inserindo transação...", "warning");
            // Ensure profileId is attached if available and not present
            const payload = { ...transaction, profileId: transaction.profileId || (profileId ? profileId : undefined) };
            const response = await axios.post('/api/transactions', payload);

            if (response.status >= 200 && response.status < 300) {
                await getTransactions(currentPage);
                await getChartData();
                await getSummary();
                showToast('Transação adicionada com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Error adding transaction:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    showToast('Erro de autenticação', 'auth');
                } else if (error.response?.status === 403) {
                    const errorMsg = error.response?.data?.error;
                    openUpgradeModal(errorMsg, 'PRO');
                } else {
                    const errorMsg = error.response?.data?.error || 'Falha desconhecida';
                    console.error('Failed to add transaction:', errorMsg);
                    showToast('Falha ao adicionar transação. Por favor, tente novamente.', 'error');
                }
            } else {
                showToast('Ocorreu um erro ao adicionar a transação. Por favor, tente novamente.', 'error');
            }
        }
    };

    const editTransaction = async (updatedTransaction: Partial<ITransaction>) => {
        try {
            showToast("Editando transação...", "warning");
            const response = await axios.put(`/api/transactions/${updatedTransaction._id}`, updatedTransaction);

            if (response.status >= 200 && response.status < 300) {
                await getTransactions(currentPage);
                await getChartData();
                await getSummary();
                showToast('Transação atualizada com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Error editing transaction:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    showToast('Erro de autenticação', 'auth');
                } else {
                    const errorMsg = error.response?.data?.error || 'Falha desconhecida';
                    console.error('Failed to edit transaction:', errorMsg);
                    showToast('Falha ao atualizar transação. Por favor, tente novamente.', 'error');
                }
            } else {
                showToast('Ocorreu um erro ao atualizar a transação. Por favor, tente novamente.', 'error');
            }
        }
    };

    const deleteTransaction = async (transactionId: string) => {
        try {
            showToast("Excluindo transação...", "warning");
            const response = await axios.delete(`/api/transactions/${transactionId}`);

            if (response.status >= 200 && response.status < 300) {
                await getTransactions(currentPage);
                await getChartData();
                await getSummary();
                showToast('A transação foi excluída com sucesso.', 'success');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    showToast('Erro de autenticação', 'auth');
                } else {
                    const errorMsg = error.response?.data?.error || 'Falha desconhecida';
                    console.error('Failed to delete transaction:', errorMsg);
                    showToast('Falha ao excluir transação. Por favor, tente novamente.', 'error');
                }
            } else {
                showToast('Ocorreu um erro ao excluir a transação. Por favor, tente novamente.', 'error');
            }
        }
    };

    const getTransaction = async (transactionId: string): Promise<ITransaction | null> => {
        try {
            showToast("Buscando transação...", "warning");
            const response = await axios.get(`/api/transactions/${transactionId}`);

            if (response.status >= 200 && response.status < 300) {
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Error getting transaction:', error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 401) {
                    showToast('Erro de autenticação', 'auth');
                    return null;
                }
            }
            showToast('Ocorreu um erro ao obter detalhes da transação. Por favor, tente novamente.', 'error');
            return null;
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
            // Fetch triggered by useEffect dep on currentPage
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            // Fetch triggered by useEffect dep on currentPage
        }
    };

    const filterTransactionsByMonth = (month: number | null) => {
        if (month !== selectedMonth) {
            setSelectedMonth(month);
            if (month === null) {
                setCurrentPage(1);
            }
        }
    };

    return (
        <TransactionsContext.Provider
            value={{
                transactions,
                allTransactions,
                chartData,
                setTransactions,
                getAllTransactions,
                getAllTransactionsPage,
                isAllTransactions,
                setIsAllTransactions,
                getTransactions,
                addTransaction,
                editTransaction,
                deleteTransaction,
                getTransaction,
                toast,
                setToast,
                currentPage,
                setCurrentPage,
                totalPages,
                handlePreviousPage,
                handleNextPage,
                filterTransactionsByMonth,
                selectedMonth,
                loading,
                summaryData,
                setAllTransactions, // Export setAllTransactions
                getChartData,
                getSummary,
            }}
        >
            {children}
        </TransactionsContext.Provider>
    );
}

export function useTransactions() {
    const context = useContext(TransactionsContext);
    if (context === undefined) {
        throw new Error("useTransactions must be used within a TransactionsProvider");
    }
    return context;
}
