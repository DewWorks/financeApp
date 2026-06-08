describe('Login with Phone Number', () => {
    beforeEach(() => {
        cy.clearAllLocalStorage();
        cy.clearCookies();
        cy.intercept('GET', '/api/users*').as('initUser');
        cy.visit('/auth/login');
        cy.wait('@initUser');
    });

    it('should accept a valid local phone number (no formatting)', () => {
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: { token: 'fake-token', tutorialGuide: false, executeQuery: false, userId: '123' },
        }).as('loginSuccess');

        cy.get('input[id="emailOrPhone"]').type('63984207313');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        cy.get('.swal2-title').should('contain', 'Sucesso');
    });

    it('should show error for invalid short number', () => {
        cy.get('input[id="emailOrPhone"]').type('6398420');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        cy.get('.swal2-title').should('contain', 'Atenção');
        cy.get('.swal2-html-container').should('contain', 'Número inválido.');
    });

    it('should show error for invalid characters', () => {
        // Digita letras no lugar de numeros
        cy.get('input[id="emailOrPhone"]').type('abcde12345');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Verifica Swal de aviso
        // Atualizado para 'Atenção' conforme screenshot do usuário
        cy.get('.swal2-title').should('contain', 'Atenção');
        // O texto pode variar, mas o titulo eh Atenção
    });
});
