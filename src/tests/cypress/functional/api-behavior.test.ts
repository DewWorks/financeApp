describe('Transactions Flow', () => {
    it('should add a transaction and update the list', () => {
        cy.visit('https://finance-app-tau-flax.vercel.app/');

        // Clicar na aba de Receita
        cy.contains('Receita').click();

        // Preencher o formulário de transação
        cy.get('input[name="description"]').type('Freelance');
        cy.get('input[name="amount"]').type('2000');
        cy.get('input[name="date"]').type('2024-11-30');

        // Clicar no botão de adicionar receita
        cy.get('button').contains('Adicionar Receita').click();

        // Verificar se a URL foi alterada para a tela inicial (Dashboard Financeiro)
        cy.url().should('include', '/');

        // Verificar se elementos da tela inicial estão visíveis
        cy.contains('Dashboard Financeiro').should('be.visible');
        cy.contains('Saldo Total').should('be.visible');
        cy.contains('Receitas').should('be.visible');
        cy.contains('Despesas').should('be.visible');
    });
});
