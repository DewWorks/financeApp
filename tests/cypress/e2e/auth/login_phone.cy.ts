describe('Login with Phone Number', () => {
    beforeEach(() => {
        cy.visit('/auth/login');
    });

    it('should accept a valid local phone number (no formatting)', () => {
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: { token: 'fake-token', tutorialGuide: false, executeQuery: false, userId: '123' },
        }).as('loginSuccess');

        cy.get('input[placeholder*="(11)"]').type('63984207313');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        cy.get('.swal2-title').should('contain', 'Sucesso');
    });

    it('should show error for invalid short number', () => {
        cy.get('input[placeholder*="(11)"]').type('6398420');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Verifica Swal de aviso correto
        cy.get('.swal2-title').should('contain', 'Atenção');
        cy.get('.swal2-html-container').should('contain', 'Verifique o número digitado');
    });

    it('should show error for invalid characters', () => {
        // Digita letras no lugar de numeros
        cy.get('input[placeholder*="(11)"]').type('abcde12345');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Verifica Swal de aviso
        // Atualizado para 'Atenção' conforme screenshot do usuário
        cy.get('.swal2-title').should('contain', 'Atenção');
        // O texto pode variar, mas o titulo eh Atenção
    });
});
