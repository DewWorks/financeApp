import { useState, useEffect, useCallback } from 'react'
import { ITransaction } from '@/interfaces/ITransaction'
import { useRouter } from 'next/navigation';

export function useTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<ITransaction[]>([]);
  // const [monthlyTransactions, setMonthlyTransactions] = useState<ITransaction[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'auth' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isAllTransactions, setIsAllTransactions] = useState<boolean>(false);
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'auth') => {
    setToast({ message, type })
  }

  const getAllTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions/all');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAllTransactions(data);
        } else {
          console.error('Erro: resposta inesperada', data);
          showToast('Erro ao carregar transações.', 'error');
        }
      } else {
        showToast('Falha ao carregar todas as transações.', 'error');
      }
    } catch (error) {
      console.error('Erro ao buscar todas as transações:', error);
      showToast('Erro ao carregar todas as transações.', 'error');
    }
  }, []);

  const getTransactions = useCallback(async (page = 1) => {
    try {
      showToast("Buscando transações paginadas.", "warning");
      const response = await fetch(`/api/transactions?page=${page}&limit=10&month=${selectedMonth}`);
      if (response.status === 401) {
        showToast("Sessão expirada. Redirecionando para login...", "warning");
        router.push("/auth/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          setTotalPages(data.totalPages || 1);
          showToast("Transações buscadas!", "success");
        } else {
          console.error("Erro: resposta inesperada", data);
          showToast("Erro ao carregar transações.", "error");
          router.push("/auth/login");
        }
      } else {
        showToast("Falha ao carregar transações.", "error");
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      showToast("Erro ao carregar transações.", "error");
      router.push("/auth/login");
    }
  }, [selectedMonth]);

  const getAllTransactionsPage = useCallback(async (page = 1) => {
    try {
      showToast("Buscando transações paginadas.", "warning");
      const response = await fetch(`/api/transactions/all/page?page=${page}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          setTotalPages(data.totalPages || 1);
          showToast("Transações buscadas!", "success");
        } else {
          console.error("Erro: resposta inesperada", data);
          showToast("Erro ao carregar transações paginadas.", "success");
        }
      } else {
        showToast("Falha ao carregar transações paginadas.", "error");
      }
    } catch (error) {
      console.error("Erro ao buscar transações paginadas:", error);
      showToast("Erro ao carregar transações paginadas.", "error");
    }
  }, []);

  // const getMonthlyTransactions = useCallback(async () => {
  //   try {
  //     const response = await fetch(`/api/transactions/month?month=${selectedMonth}`);
  //     if (response.ok) {
  //       const data = await response.json();
  //       setMonthlyTransactions(data.transactions);
  //     } else {
  //       showToast('Erro ao carregar transações do mês.', 'error');
  //     }
  //   } catch (error) {
  //     console.error('Erro ao buscar transações do mês:', error);
  //     showToast('Ocorreu um erro ao carregar transações do mês.', 'error');
  //   }
  // }, [selectedMonth]);

  useEffect(() => {
    if (!isAllTransactions) {
      getTransactions(currentPage);
    }
  }, [currentPage, selectedMonth, isAllTransactions]);

  useEffect(() => {
    if (isAllTransactions) {
      getAllTransactionsPage(currentPage);
    }
  }, [isAllTransactions]);

  // const fetchTransactions = useCallback(async () => {
  //   try {
  //     const response = await fetch('/api/admin/transactions');
  //     if (response.ok) {
  //       const data = await response.json();
  //       if (Array.isArray(data.transactions)) {
  //         setTransactions(data.transactions);
  //       } else {
  //         console.error('Data fetched is not an array:', data);
  //         setTransactions([]);
  //       }
  //     } else if (response.status === 401) {
  //       setToast({ message: 'Erro de autenticação', type: 'auth' });
  //       showToast('Erro de autenticação', 'auth');
  //     } else {
  //       console.error('Failed to fetch transactions');
  //       showToast('Falha ao carregar transações. Por favor, tente novamente.', 'error');
  //     }
  //   } catch (error) {
  //     console.error('Error fetching transactions:', error);
  //     setTransactions([]);
  //     showToast('Ocorreu um erro ao carregar as transações. Por favor, tente novamente.', 'error');
  //   }
  // }, [AuthErrorModal]);

  const addTransaction = async (transaction: Partial<ITransaction>) => {
    try {
      showToast("Inserindo transação...", "warning");
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction)
      })
      if (response.ok) {
        await getTransactions()
        showToast('Transação adicionada com sucesso!', 'success');
      } else if (response.status === 401) {
        showToast('Erro de autenticação', 'auth');
      } else {
        const errorData = await response.json()
        console.error('Failed to add transaction:', errorData.error)
        showToast('Falha ao adicionar transação. Por favor, tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
      showToast('Ocorreu um erro ao adicionar a transação. Por favor, tente novamente.', 'error');
    }
  }

  const editTransaction = async (updatedTransaction: Partial<ITransaction>) => {
    try {
      showToast("Editando transação...", "warning");
      const response = await fetch(`/api/transactions/${updatedTransaction._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTransaction)
      })

      if (response.ok) {
        await getTransactions()
        showToast('Transação atualizada com sucesso!', 'success');
      } else if (response.status === 401) {
        showToast('Erro de autenticação', 'auth');
      } else {
        const errorData = await response.json()
        console.error('Failed to edit transaction:', errorData.error)
        showToast('Falha ao atualizar transação. Por favor, tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Error editing transaction:', error)
      showToast('Ocorreu um erro ao atualizar a transação. Por favor, tente novamente.', 'error');
    }
  }

  const deleteTransaction = async (transactionId: string) => {
    try {
      showToast("Excluindo transação...", "warning");
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await getTransactions()
        showToast('A transação foi excluída com sucesso.', 'success');
      } else if (response.status === 401) {
        showToast('Erro de autenticação', 'auth');
      } else {
        const errorData = await response.json()
        console.error('Failed to delete transaction:', errorData.error)
        showToast('Falha ao excluir transação. Por favor, tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      showToast('Ocorreu um erro ao excluir a transação. Por favor, tente novamente.', 'error');
    }
  }

  const getTransaction = async (transactionId: string): Promise<ITransaction | null> => {
    try {
      showToast("Buscando transação...", "warning");
      const response = await fetch(`/api/transactions/${transactionId}`)
      if (response.ok) {
        return await response.json()
      } else if (response.status === 401) {
        showToast('Erro de autenticação', 'auth');
        return null;
      } else {
        console.error('Failed to get transaction')
        showToast('Falha ao obter detalhes da transação. Por favor, tente novamente.', 'error');
        return null
      }
    } catch (error) {
      console.error('Error getting transaction:', error)
      showToast('Ocorreu um erro ao obter detalhes da transação. Por favor, tente novamente.', 'error');
      return null
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);

      if (isAllTransactions) {
        getAllTransactionsPage(newPage);
      } else {
        getTransactions(newPage);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);

      if (isAllTransactions) {
        getAllTransactionsPage(newPage);
      } else {
        getTransactions(newPage);
      }
    }
  };

  const filterTransactionsByMonth = (month: number | null) => {
    setSelectedMonth(month);
    if (month === null) {
      // Recarrega os dados da API para garantir que originalTransactions contenha todas as transações
      // getTransactions();
      setCurrentPage(1);
    }
  };


  return {
    transactions,
    allTransactions,
    setTransactions,
    getAllTransactions,
    getAllTransactionsPage,
    isAllTransactions,
    setIsAllTransactions,
    getTransactions,
    //monthlyTransactions,
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
  }
}

