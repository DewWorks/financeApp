describe('Fluxo de Cadastro (Register)', () => {
    beforeEach(() => {
        cy.visit('/auth/register');
    });

    it('Deve cadastrar um novo usuário com sucesso', () => {
        const uniqueId = Date.now();
        const email = `test.cypress.${uniqueId}@example.com`;
        const phone = `639${uniqueId.toString().slice(-8)}`;

        cy.get('input[id="name"]').type('Usuário Cypress');
        cy.get('input[id="email"]').type(email);
        cy.get('input[id="cel"]').type(phone);
        cy.get('input[id="password"]').type('SenhaForte123');

        cy.contains('button', 'Cadastrar').click();

        // Verifica sucesso via Swal e redirecionamento
        cy.get('.swal2-title').should('contain', 'Sucesso');
        // Pode fechar o swal clicando no botão se necessário, ou esperar o timer
        // cy.get('.swal2-confirm').click(); 

        // Verifica se foi para a pagina de login
        cy.url().should('include', '/auth/login');
    });
});
