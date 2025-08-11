import type { IFinancePlanCalculation } from "@/interfaces/IFinancePlan"

export class FinancePlanCalculator {
    static calculatePlan(
        targetAmount: number,
        currentAmount: number,
        desiredDate: Date,
        userMonthlyIncome?: number,
    ): IFinancePlanCalculation {
        const now = new Date()
        const monthsRemaining = Math.max(1, Math.ceil((desiredDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
        const amountNeeded = Math.max(0, targetAmount - currentAmount)

        const monthlySavingNeeded = amountNeeded / monthsRemaining
        const weeklySavingNeeded = monthlySavingNeeded / 4.33
        const dailySavingNeeded = monthlySavingNeeded / 30

        // Determinar dificuldade
        let difficulty: "easy" | "medium" | "hard" | "impossible" = "easy"
        let isAchievable = true

        if (userMonthlyIncome) {
            const savingPercentage = (monthlySavingNeeded / userMonthlyIncome) * 100

            if (savingPercentage > 80) {
                difficulty = "impossible"
                isAchievable = false
            } else if (savingPercentage > 50) {
                difficulty = "hard"
            } else if (savingPercentage > 25) {
                difficulty = "medium"
            } else {
                difficulty = "easy"
            }
        } else {
            // Sem informação de renda, usar valores absolutos
            if (monthlySavingNeeded > 5000) {
                difficulty = "hard"
            } else if (monthlySavingNeeded > 2000) {
                difficulty = "medium"
            }
        }

        // Gerar sugestões
        const suggestions = this.generateSuggestions(
            monthlySavingNeeded,
            weeklySavingNeeded,
            dailySavingNeeded,
            difficulty,
            monthsRemaining,
        )

        return {
            monthsRemaining,
            monthlySavingNeeded,
            weeklySavingNeeded,
            dailySavingNeeded,
            difficulty,
            suggestions,
            isAchievable,
        }
    }

    private static generateSuggestions(
        monthly: number,
        weekly: number,
        daily: number,
        difficulty: string,
        months: number,
    ): string[] {
        const suggestions: string[] = []

        // Sugestões baseadas no valor diário
        if (daily < 10) {
            suggestions.push("Corte um café por dia e você já atinge sua meta!")
        } else if (daily < 30) {
            suggestions.push("Evite um lanche ou delivery por dia")
        } else if (daily < 50) {
            suggestions.push("Considere usar transporte público em vez de Uber")
        }

        // Sugestões baseadas no valor semanal
        if (weekly < 100) {
            suggestions.push("Cozinhe em casa no fim de semana em vez de sair")
        } else if (weekly < 300) {
            suggestions.push("Cancele uma assinatura de streaming temporariamente")
        }

        // Sugestões baseadas na dificuldade
        if (difficulty === "hard" || difficulty === "impossible") {
            suggestions.push("Considere estender o prazo para tornar mais viável")
            suggestions.push("Procure uma renda extra ou freelances")
            suggestions.push("Venda itens que não usa mais")
        }

        if (difficulty === "medium") {
            suggestions.push("Crie um orçamento detalhado para identificar gastos desnecessários")
            suggestions.push("Automatize a poupança para não esquecer")
        }

        if (difficulty === "easy") {
            suggestions.push("Configure uma transferência automática mensal")
            suggestions.push("Considere investir o dinheiro em uma poupança ou CDB")
        }

        // Sugestões baseadas no tempo
        if (months > 12) {
            suggestions.push("Com esse prazo longo, considere investimentos de maior rendimento")
        } else if (months < 6) {
            suggestions.push("Prazo curto: foque em economizar e evite investimentos arriscados")
        }

        return suggestions.slice(0, 4) // Máximo 4 sugestões
    }
}
