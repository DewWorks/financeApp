import { useEffect, useState } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import Swal from "sweetalert2"

interface UseDashboardTutorialProps {
    setActiveTab: (tab: string) => void
    setViewMode: (mode: 'list' | 'card' | 'table') => void
    userRequestName?: string
    isLoading?: boolean
}

export function useDashboardTutorial({ setActiveTab, setViewMode, userRequestName, isLoading }: UseDashboardTutorialProps) {
    const [runTutorial, setRunTutorial] = useState(false)

    // Check availability when page loading is complete and dashboard is fully mounted
    useEffect(() => {
        if (isLoading) return; // Wait until loading skeleton transitions out

        const isCompleted = localStorage.getItem("tutorial-guide-v2")
        if (!isCompleted && !runTutorial) {
            // Short delay to allow dashboard entry animations to finish
            const timer = setTimeout(() => {
                setRunTutorial(true)
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [isLoading])

    useEffect(() => {
        if (runTutorial) {
            startTutorial()
        }
    }, [runTutorial])

    const getUserIdLocal = () => {
        if (typeof window !== "undefined") {
            try {
                const userStr = localStorage.getItem("user_data")
                if (userStr) {
                    const parsed = JSON.parse(userStr)
                    return parsed._id || parsed.id || "user"
                }
            } catch (e) {
                console.error("Failed to parse user data", e)
            }
            return "user"
        }
        return null
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
                text: "Você está no modo de demonstração. Sinta-se à vontade para interagir com o Fin AI ou fazer upload de faturas. Cadastre-se quando quiser salvar seus dados!",
                icon: "success",
                showCancelButton: true,
                confirmButtonText: "Criar Conta / Entrar",
                cancelButtonText: "Continuar Testando",
                allowOutsideClick: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "/auth/login";
                }
            });
            return;
        }

        const userId = getUserIdLocal()
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
                title: "🚀 FinancePro Mobile!",
                description: "Seja muito bem-vindo! Vamos te mostrar como controlar suas finanças em poucos toques com inteligência artificial.",
                showButtons: ["next"],
            },
        },
        {
            element: "#transactions-values",
            popover: {
                title: "💰 Visão Geral",
                description: "Aqui você acompanha o seu Saldo Atual, as Receitas do mês e as Despesas consolidadas.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#mobile-bottom-nav",
            popover: {
                title: "📲 Barra de Navegação",
                description: "Navegue de forma intuitiva por todas as telas do aplicativo a partir desta barra inferior.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#mobile-tab-transactions",
            popover: {
                title: "📝 Histórico Completo",
                description: "Acesse todas as transações, realize buscas rápidas e filtre lançamentos por tags ou categorias.",
            },
            onHighlightStarted: () => setActiveTab('transactions'),
        },
        {
            element: "#mobile-add-btn",
            popover: {
                title: "➕ Menu de Acesso Rápido",
                description: "Toque aqui para abrir o menu suspenso e lançar receitas, despesas ou fazer upload de arquivos de forma ágil.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#mobile-tab-fin",
            popover: {
                title: "🎙️ Fin AI — Seu Co-piloto de Voz",
                description: "Nosso recurso estrela! Toque na aba do Fin AI para iniciar o chat por voz/texto e lançar gastos sem digitar nada.",
            },
            onHighlightStarted: () => setActiveTab('fin'),
        },
        {
            element: "#fin-chat-container",
            popover: {
                title: "💬 Interação Inteligente",
                description: "Essa é a janela do Fin AI. Toque no microfone ou digite, por exemplo: 'gastei R$ 40 em padaria hoje' e assista o Fin processar e registrar tudo!",
            },
            onHighlightStarted: () => setActiveTab('fin'),
        },
        {
            element: "#mobile-tab-analytics",
            popover: {
                title: "📈 Painel & Metas",
                description: "Acompanhe gráficos detalhados de despesas e visualize o progresso das suas metas de poupança mensais.",
            },
            onHighlightStarted: () => setActiveTab('analytics'),
        }
    ]

    const getDesktopSteps = () => [
        {
            popover: {
                title: "📊 Gestão Inteligente de Finanças",
                description: `Olá ${userRequestName || "Visitante"}! Bem-vindo ao FinancePro. Vamos te apresentar as principais ferramentas do seu painel em tela cheia.`,
                showButtons: ["next"],
            },
        },
        {
            element: "#profile-switcher",
            popover: {
                title: "👥 Multi-Perfis & Compartilhamento",
                description: "Alterne instantaneamente entre suas finanças pessoais, familiares ou da sua empresa por aqui.",
            },
        },
        {
            element: "#transactions-values",
            popover: {
                title: "💰 Resumo Financeiro",
                description: "Seus KPIs mais importantes do mês: saldo líquido atual, soma de receitas e despesas totais.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#voice-assistant-widget",
            popover: {
                title: "🎙️ Fin AI — Voz & Importação Avançada",
                description: "Aqui você fala naturalmente para registrar transações ('recebi 2000 reais de bônus') ou faz upload de faturas em PDF/CSV para conciliação automática com IA!",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#filter-bar",
            popover: {
                title: "🔍 Busca e Filtros Rápidos",
                description: "Consulte transações rapidamente digitando termos de busca ou selecionando períodos específicos.",
            },
            onHighlightStarted: () => {
                setActiveTab('transactions')
                setViewMode('table')
            },
        },
        {
            element: "#view-toggles",
            popover: {
                title: "👁️ Visualizações Personalizadas",
                description: "Alterne o layout da tabela entre tabela clássica, listagem simples ou uma moderna grade de cards.",
            },
            onHighlightStarted: () => setActiveTab('transactions'),
        },
        {
            element: "#desktop-add-btn",
            popover: {
                title: "➕ Lançamento Tradicional",
                description: "Prefere preencher manualmente? Clique aqui para abrir o formulário detalhado de receitas ou despesas.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#transactions-goals",
            popover: {
                title: "🎯 Suas Metas Mensais",
                description: "Defina objetivos financeiros (ex: 'Poupar R$ 1.000 para viagem') e acompanhe a barra de progresso em tempo real.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        },
        {
            element: "#transactions-chart",
            popover: {
                title: "📈 Gráficos Interativos",
                description: "Compare suas receitas e despesas ou veja a distribuição percentual dos seus gastos por categoria.",
            },
            onHighlightStarted: () => setActiveTab('home'),
        }
    ]

    return {
        runTutorial,
        setRunTutorial
    }
}
