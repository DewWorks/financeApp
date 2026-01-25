
describe('SaaS & Plan Limits', () => {
    const mockFreeUser = {
        _id: 'user-free-123',
        name: 'Free User',
        email: 'free@test.com',
        subscription: { plan: 'FREE' }
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
        cy.intercept('GET', '/api/admin/users/*', {
            statusCode: 200,
            body: mockFreeUser
        }).as('getUser');

        // Mock Data
        cy.intercept('GET', '/api/transactions*', { body: [] }).as('getTransactions');
        cy.intercept('GET', '/api/insights*', { body: mockStats }).as('getInsights');

        // Mock Secondary Endpoints
        cy.intercept('GET', '/api/profiles', { body: [] });
        cy.intercept('GET', '/api/goals', { body: [] });
        cy.intercept('GET', '/api/bank-connections', { body: [] });
    });

    it('Visits Pricing Page and highlights FREE plan as Current', () => {
        cy.visit('/pricing', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('user-id', 'user-free-123');
                win.localStorage.setItem('auth_token', 'mock-token-123');
                win.localStorage.setItem('tutorial-guide', 'true');
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

    it('Shows Upgrade Modal when clicking Bank Connection (Open Finance)', () => {
        cy.visit('/', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('user-id', 'user-free-123');
                win.localStorage.setItem('auth_token', 'mock-token-123');
                win.localStorage.setItem('tutorial-guide', 'true');
            }
        });

        cy.wait('@getUser');

        // Ensure page loaded
        cy.contains('Dashboard').should('be.visible');

        // Locate Open Finance Widget and click "Conectar"
        cy.contains('Minhas Contas').should('be.visible');

        // Use more specific selector to avoid clicking hidden elements
        cy.contains('button', 'Gerenciar').click({ force: true });

        // OR click the main CTA if empty state
        // cy.contains('button', 'Conectar Conta').click();

        // Expect Upgrade Modal
        // "Desbloqueie esse recurso" is the header of UpgradeModal
        cy.contains('Desbloqueie esse recurso').should('be.visible');
        cy.contains('plano MAX').should('be.visible');
        cy.contains('Fazer Upgrade').should('be.visible');
    });

    it('Shows Upgrade Modal when accessing Deep Insights', () => {
        cy.visit('/', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('user-id', 'user-free-123');
                win.localStorage.setItem('auth_token', 'mock-token-123');
                win.localStorage.setItem('tutorial-guide', 'true');
            }
        });

        cy.wait('@getUser');

        // Click the Insight Card to trigger detail modal
        cy.contains('Mantenha o foco').should('be.visible').click();

        // Since user is FREE, checking deep insights feature might trigger modal
        // Check if Upgrade Modal appears OR if the Detail Modal opens (depending on gate level)
        // Our mock insight is "general", but let's assume we want to test a gated interaction.

        // Note: If the test expects an Upgrade Modal immediately upon click, 
        // it means the whole Widget Click is gated for Deep Insights. 
        // Based on FinancialInsight.tsx: 
        // if (!checkFeature('DEEP_INSIGHTS')) openUpgradeModal(...)

        // So clicking SHOULD open Upgrade Modal.
        cy.contains('Desbloqueie esse recurso').should('be.visible');
        cy.contains('plano MAX').should('be.visible');
    });

    it('Handles Transaction Creation Limit (Backend Rejection)', () => {
        cy.visit('/', {
            onBeforeLoad: (win) => {
                win.localStorage.setItem('user-id', 'user-free-123');
                win.localStorage.setItem('auth_token', 'mock-token-123');
                win.localStorage.setItem('tutorial-guide', 'true');
            }
        });

        cy.wait('@getUser');

        // Create Limit Rejection Intercept
        cy.intercept('POST', '/api/transactions', {
            statusCode: 403,
            body: { error: 'Limite de transações atingido' }
        }).as('createTransaction');

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
