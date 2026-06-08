describe('Dashboard Home', () => {

    beforeEach(() => {
        cy.clearAllLocalStorage();
        cy.clearCookies();

        const uniqueId = Date.now();
        const email = `user.dash.${uniqueId}@example.com`;
        const password = 'Password123!';

        // Precisamos de um usuario logado. 
        cy.intercept('GET', '/api/users*').as('initUser');
        cy.visit('/auth/register');
        cy.wait('@initUser');
        cy.get('input[id="name"]').type('User Dashboard');
        cy.get('input[id="email"]').type(email);
        cy.get('input[id="cel"]').type(`639${uniqueId.toString().slice(-8)}`);
        cy.get('input[id="password"]').type(password);
        cy.get('input[id="terms"]').check();
        cy.contains('button', 'Cadastrar').click();

        cy.get('.swal2-confirm').click();

        cy.get('input[id="emailOrPhone"]').type(email);
        cy.get('input[id="password"]').type(password);

        cy.window().then((win) => {
            win.localStorage.setItem('tutorial-guide-v2', 'true');
        });

        cy.contains('button', 'Entrar').click();

        // Close success alert and proceed
        cy.get('.swal2-confirm').click();
 
        cy.contains('Saldo Atual', { timeout: 10000 }).should('be.visible');
    });

    it('Deve exibir o Card de Saldo', () => {
        cy.contains('Saldo Atual').should('be.visible');
        // Verifica se existe algum valor financeiro
        cy.get('#transactions-values').should('contain', 'R$');
    });

    it('Deve navegar entre meses usando o seletor', () => {
        // Clica em um mês diferente (ex: Dez) para validar filtro
        // force: true pois pode ter tooltip ou algo na frente rapidinho
        cy.contains('button', 'Dez').click({ force: true });
        cy.wait(1000);

        // Verifica mudança visual
        cy.contains('Filtrando por:').should('be.visible');
        cy.contains('Dezembro').should('be.visible');
    });
});
