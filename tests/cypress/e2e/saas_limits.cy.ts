
describe('SaaS & Plan Limits', () => {
    const mockFreeUser = {
        _id: 'user-free-123',
        name: 'Free User',
        email: 'free@test.com',
        subscription: { plan: 'FREE' },
        terms: { accepted: true }
    };

    const mockStats = {
        greeting: "Olá",
        dailySummary: { total: 0 },
        insights: [
            {
                id: "mock-insight-1",
                type: "general",
                text: "Mantenha o foco",
                value: "---",
                trend: "neutral",
                details: "Registre suas movimentações para gerar inteligência financeira.",
                recommendation: "O controle começa pelo registro diário."
            }
        ]
    };

    beforeEach(() => {
        // Mock User Profile Fetch
        cy.intercept('GET', '/api/users*', {
            statusCode: 200,
            body: mockFreeUser
        }).as('getUser');

        // Mock Data
        cy.intercept('GET', '/api/transactions*', { body: { transactions: [], totalPages: 1 } }).as('getTransactions');
        cy.intercept('GET', '/api/insights*', { body: mockStats }).as('getInsights');

        // Mock Secondary Endpoints
        cy.intercept('GET', '/api/profiles*', { body: [] });
        cy.intercept('GET', '/api/goals*', { body: [] });
        cy.intercept('GET', '/api/bank-connections*', { body: [] });
        cy.intercept('GET', '/api/transactions/summary*', { body: { income: 0, expense: 0, balance: 0 } }).as('getSummary');
    });

    it('Visits Pricing Page and highlights FREE plan as Current', () => {
        cy.visit('/pricing', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('user-id', 'user-free-123');
                win.localStorage.setItem('auth_token', 'mock-token-123');
                win.localStorage.setItem('tutorial-guide-v2', 'true');
            }
        });

        cy.wait('@getUser');

        // Check if "Seu Plano Atual" is visible on Free card
        cy.contains('h3', 'Starter')
            .parents('.relative')
            .first()
            .find('button')
            .should('contain.text', 'Plano Atual');

        // PRO should NOT have it
        cy.contains('h3', 'PRO')
            .parents('.relative')
            .first()
            .find('button')
            .should('not.contain.text', 'Plano Atual');
    });

    it('Ensures Bank Connection (Open Finance) Widget is NOT rendered on the dashboard', () => {
        cy.visit('/', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('user-id', 'user-free-123');
                win.localStorage.setItem('auth_token', 'mock-token-123');
                win.localStorage.setItem('tutorial-guide-v2', 'true');
            }
        });

        cy.wait('@getUser');

        // Ensure page loaded
        cy.contains('Saldo Atual', { timeout: 10000 }).should('be.visible');

        // Open Finance Widget should NOT be visible
        cy.contains('Minhas Contas').should('not.exist');
    });

    it('Shows Upgrade Modal when accessing Deep Insights', () => {
        cy.visit('/', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('user-id', 'user-free-123');
                win.localStorage.setItem('auth_token', 'mock-token-123');
                win.localStorage.setItem('tutorial-guide-v2', 'true');
            }
        });

        cy.wait('@getUser');

        // Ensure page loaded
        cy.contains('Saldo Atual', { timeout: 10000 }).should('be.visible');

        // Click the Insight Card to trigger detail modal
        cy.contains('Dica Financeira Exclusiva', { timeout: 10000 }).should('be.visible').click();

        // Since user is FREE, checking deep insights feature might trigger modal
        // Check if Upgrade Modal appears OR if the Detail Modal opens (depending on gate level)
        // Our mock insight is "general", but let's assume we want to test a gated interaction.

        // Note: If the test expects an Upgrade Modal immediately upon click, 
        // it means the whole Widget Click is gated for Deep Insights. 
        // Based on FinancialInsight.tsx: 
        // if (!checkFeature('DEEP_INSIGHTS')) openUpgradeModal(...)

        // So clicking SHOULD open Upgrade Modal.
        cy.contains('Desbloqueie o Poder Máximo').should('be.visible');
        cy.contains('plano MAX').should('be.visible');
    });

    it('Handles Transaction Creation Limit (Backend Rejection)', () => {
        cy.visit('/', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('user-id', 'user-free-123');
                win.localStorage.setItem('auth_token', 'mock-token-123');
                win.localStorage.setItem('tutorial-guide-v2', 'true');
            }
        });

        cy.wait('@getUser');

        // Create Limit Rejection Intercept
        cy.intercept('POST', '/api/transactions', {
            statusCode: 403,
            body: { error: 'Limite de transações atingido' }
        }).as('createTransaction');

        // Ensure page loaded
        cy.contains('Saldo Atual', { timeout: 10000 }).should('be.visible');

        // Open Modal
        cy.contains('button', 'Receita').click();

        // Fill Form
        cy.get('input[id="description"]').type('Teste Limite');
        cy.get('input[id="amount"]').type('100');

        // Submit
        cy.contains('button', 'Adicionar Receita').click();

        cy.wait('@createTransaction');

        // SweetAlert Check
        cy.contains('Limite de transações atingido').should('be.visible');
    });

});
