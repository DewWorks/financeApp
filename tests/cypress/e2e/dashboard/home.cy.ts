describe('Dashboard Home', () => {

    beforeEach(() => {
        const uniqueId = Date.now();
        const email = `user.dash.${uniqueId}@example.com`;
        const password = 'Password123!';

        // Precisamos de um usuario logado. 
        cy.visit('/auth/register');
        cy.get('input[id="name"]').type('User Dashboard');
        cy.get('input[id="email"]').type(email);
        cy.get('input[id="cel"]').type(`639${uniqueId.toString().slice(-8)}`);
        cy.get('input[id="password"]').type(password);
        cy.contains('button', 'Cadastrar').click();

        cy.get('.swal2-confirm').click();

        cy.get('input[id="emailOrPhone"]').type(email);
        cy.get('input[id="password"]').type(password);
        cy.contains('button', 'Entrar').click();

        // Lidar com tutorial no login
        cy.wait(1000); // Wait for tutorial to pop
        cy.get('body').then(($body) => {
            if ($body.find('.driver-popover').length > 0) {
                cy.get('.driver-close-btn').click();
            }
        });

        // Lidar com swal de 'Tutorial Concluido' se houver
        cy.wait(500);
        cy.get('body').then(($body) => {
            if ($body.find('.swal2-container').length > 0) {
                cy.get('.swal2-confirm').click({ force: true });
            }
        });
    });

    it('Deve exibir o Card de Saldo', () => {
        cy.contains('Saldo Total').should('be.visible');
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
