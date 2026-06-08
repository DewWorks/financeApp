describe('Gestão de Transações', () => {

    before(() => {
        cy.clearAllLocalStorage();
        cy.clearCookies();

        const uniqueId = Date.now();
        const email = `user.trans.${uniqueId}@example.com`;
        const password = 'Password123!';

        // 1. Cadastrar usuário novo para teste limpo
        cy.intercept('GET', '/api/users*').as('initUser');
        cy.visit('/auth/register');
        cy.wait('@initUser');
        cy.get('input[id="name"]').type('User Transactions');
        cy.get('input[id="email"]').type(email);
        cy.get('input[id="cel"]').type(`639${uniqueId.toString().slice(-8)}`);
        cy.get('input[id="password"]').type(password);
        cy.get('input[id="terms"]').check();
        cy.contains('button', 'Cadastrar').click();

        // 2. Fazer Login
        cy.get('.swal2-confirm').click(); // Fecha modal se houver
        cy.url().should('include', '/auth/login');

        cy.get('input[id="emailOrPhone"]').type(email);
        cy.get('input[id="password"]').type(password);

        cy.window().then((win) => {
            win.localStorage.setItem('tutorial-guide-v2', 'true');
        });

        cy.contains('button', 'Entrar').click();

        // Close success alert and proceed
        cy.get('.swal2-confirm').click();
 
        // 3. Verifica se entrou na Home
        cy.url().should('eq', Cypress.config().baseUrl + '/');

        cy.contains('Saldo Atual', { timeout: 10000 }).should('be.visible');
    });

    it('Deve adicionar uma Nova Receita', () => {
        // Abre o modal de Nova Receita
        cy.contains('button', '+ Receita').first().click({ force: true });

        // Confirma se o modal abriu
        cy.contains('Adicionar Receita').should('be.visible');

        // Preenche o formulário
        cy.get('input[id="description"]').type('Salário Cypress');
        cy.get('input[id="amount"]').type('5000');

        // Salvar
        cy.contains('button', 'Adicionar Receita').click();

        // Verifica feedback e listagem
        cy.contains('Transação adicionada com sucesso!').should('be.visible');
 
        // Verifica se apareceu na tabela
        cy.contains('Salário Cypress').should('be.visible');
        cy.contains('R$ 5000.00').should('be.visible');
    });
});
