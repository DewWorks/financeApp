import { useEffect, useState } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import Swal from "sweetalert2"

interface UseDashboardTutorialProps {
    setActiveTab: (tab: string) => void
    setViewMode: (mode: 'list' | 'card' | 'table') => void
    userRequestName?: string
}

export function useDashboardTutorial({ setActiveTab, setViewMode, userRequestName }: UseDashboardTutorialProps) {
    const [runTutorial, setRunTutorial] = useState(false)

    // Check availability on mount
    useEffect(() => {
        const checkTutorial = () => {
            const isCompleted = localStorage.getItem("tutorial-guide-v2")
            // Wait a bit for loading? Or check immediately?
            // Page usually checks loading first. 
            // We'll let page.tsx handle the "loading" check and runTutorial will be false until explicitly set?
            // Actually, page.tsx logic was: useEffect(() => { if (!loading && !isCompleted) setRunTutorial(true) }, [loading])
            // We can expose setRunTutorial or handle it inside if we pass 'loading' prop.
            // Let's expose setRunTutorial and checks.
            if (!isCompleted) {
                // Delay to ensure UI is ready
                setTimeout(() => setRunTutorial(true), 2000)
            }
        }
        checkTutorial()
    }, [])

    useEffect(() => {
        if (runTutorial) {
            startTutorial()
        }
    }, [runTutorial])

    const getUserIdLocal = () => {
        if (typeof window !== "undefined") {
            const userStr = localStorage.getItem("user_data"); // Assuming stored here? Or decoded token?
            // Fallback
            return "user";
        }
        return null;
    }

    const startTutorial = () => {
        const isMobile = window.innerWidth < 768

        const driverObj = driver({
            showProgress: true,
            allowClose: true,
            overlayOpacity: 0.6,
            allowKeyboardControl: true,
            doneBtnText: "Finalizar",
            nextBtnText: "Próximo",
            prevBtnText: "Voltar",
            onDestroyed: () => {
                handleTutorialFinish()
            },
            popoverClass: "custom-popover",
            steps: isMobile ? (getMobileSteps() as any) : (getDesktopSteps() as any)
        })

        driverObj.drive()
    }

    const handleTutorialFinish = async () => {
        localStorage.setItem("tutorial-guide-v2", "true")
        setRunTutorial(false)

        const token = typeof window !== "undefined" && localStorage.getItem("auth_token");
        if (!token) {
            Swal.fire({
                title: "🎉 Tour Concluído!",
                text: "Crie sua conta ou faça login agora para começar a gerenciar suas finanças de verdade!",
                icon: "success",
                confirmButtonText: "Criar Conta / Entrar",
                allowOutsideClick: false,
            }).then(() => {
                window.location.href = "/auth/login";
            });
            return;
        }

        const userId = getUserIdLocal()
        // API Call (Fire and forget)
        try {
            if (userId) {
                await fetch("/api/admin/users/tutorialFinished", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId }),
                })
            }
        } catch (error) {
            console.error("Failed to update tutorial status:", error)
        }

        Swal.fire({
            title: "🎉 Parabéns!",
            text: "Você completou o tour! Aproveite o FinancePro ao máximo. 🚀",
            icon: "success",
            confirmButtonText: "Começar",
            timer: 4000,
            showConfirmButton: true,
        })
    }

    const getMobileSteps = () => [
        {
            popover: {
                title: "🚀 Seu Dinheiro no Bolso!",
                description: "Bem-vindo ao FinancePro Mobile! Vamos te mostrar como controlar suas finanças com agilidade.",
                showButtons: ["next"],
            },
        },
        {
            element: "#transactions-values",
            popover: {
                title: "💰 Visão Geral",
                description: "Acompanhe seus indicadores principais: Saldo, Receitas e Despesas do mês.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#mobile-bottom-nav",
            popover: {
                title: "📲 Navegação Rápida",
                description: "Use esta barra para transitar entre Início, Tabela, Metas e Análises.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#mobile-add-btn",
            popover: {
                title: "➕ Adicionar Rápido",
                description: "Toque no botão central para lançar uma nova Receita ou Despesa em segundos!",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#filter-bar",
            popover: {
                title: "🔍 Filtros",
                description: "Filtre seus dados por Tipo (Receita/Despesa) ou Categoria. Use a busca para encontrar itens específicos.",
            },
            onHighlightStarted: () => setActiveTab('transactions'),
        },
        {
            element: "#transactions-table",
            popover: {
                title: "📝 Lista de Transações",
                description: "Veja seu histórico. DICA: Arraste o card para a esquerda/direita para editar ou excluir!",
            },
            onHighlightStarted: () => setActiveTab('transactions'),
        },
        {
            element: "#transactions-goals",
            popover: {
                title: "🎯 Suas Metas",
                description: "Defina objetivos financeiros e acompanhe seu progresso mês a mês.",
            },
            onHighlightStarted: () => setActiveTab('goals'),
        },
        {
            element: "#transactions-chart",
            popover: {
                title: "📈 Análise",
                description: "Entenda para onde vai seu dinheiro com gráficos detalhados.",
            },
            onHighlightStarted: () => setActiveTab('analytics'),
        }
    ]

    const getDesktopSteps = () => [
        {
            popover: {
                title: "📊 Gestão Profissional",
                description: "Bem-vindo ao seu Painel FinancePro! Controle total das suas finanças em tela cheia.",
                showButtons: ["next"],
            },
        },
        {
            element: "#profile-switcher",
            popover: {
                title: "👥 Perfis e Conta",
                description: "Alterne entre finanças pessoais e contas compartilhadas aqui.",
            },
        },
        {
            element: "#transactions-values",
            popover: {
                title: "💰 Resumo Executivo",
                description: "Seus KPIs principais: Saldo Atual, Entradas e Saídas do período.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#filter-bar",
            popover: {
                title: "🔍 Filtros Avançados",
                description: "Encontre exatamente o que precisa. Filtre por Tipo, Tag ou use a busca textual.",
            },
            onHighlightStarted: () => {
                setActiveTab('transactions')
                setViewMode('table')
            },
        },
        {
            element: "#view-toggles",
            popover: {
                title: "👁️ Modos de Visualização",
                description: "Escolha como visualizar seus dados: Lista, Grade de Cards ou Tabela Detalhada.",
            },
            onHighlightStarted: () => setActiveTab('transactions'),
        },
        {
            element: "#desktop-add-btn",
            popover: {
                title: "➕ Lançamentos",
                description: "Registre novas movimentações rapidamente por aqui.",
            },
        },
        {
            element: "#transactions-goals",
            popover: {
                title: "🎯 Metas Financeiras",
                description: "Defina e monitore seus objetivos de curto e longo prazo.",
            },
            onHighlightStarted: () => setActiveTab('goals'),
        },
        {
            element: "#transactions-chart",
            popover: {
                title: "📈 Análise e Projeções",
                description: "Gráficos de fluxo de caixa, distribuição de gastos e projeções futuras.",
            },
            onHighlightStarted: () => setActiveTab('analytics'),
        }
    ]

    return {
        runTutorial,
        setRunTutorial
    }
}
