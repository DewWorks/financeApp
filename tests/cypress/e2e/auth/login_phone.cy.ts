
describe('Login with Phone Number', () => {
    beforeEach(() => {
        // Visita a página de login antes de cada teste
        cy.visit('/auth/login');
    });

    it('should accept a valid local phone number (no formatting)', () => {
        // Mock do sucesso do login
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: { token: 'fake-token', tutorialGuide: false, executeQuery: false, userId: '123' },
        }).as('loginSuccess');

        // Digita número sem formatação: 63984207313
        cy.get('input[placeholder*="(11)"]').type('63984207313');
        cy.get('input[type="password"]').type('password123');

        // Verifica se o helper text aparece (opcional, se implementado)
        // cy.contains('Telefone detectado').should('be.visible');

        cy.get('button[type="submit"]').click();

        // Espera o swal de sucesso ou redirecionamento
        cy.get('.swal2-title').should('contain', 'Sucesso');
    });

    it('should accept a formatted phone number', () => {
        cy.intercept('POST', '/api/auth/login', {
            statusCode: 200,
            body: { token: 'fake-token', tutorialGuide: false, executeQuery: false, userId: '123' },
        }).as('loginSuccess');

        // Digita número formatado: (63) 98420-7313
        cy.get('input[placeholder*="(11)"]').type('(63) 98420-7313');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.get('.swal2-title').should('contain', 'Sucesso');
    });

    it('should show error for invalid short number', () => {
        // Digita número curto: 6398420
        cy.get('input[placeholder*="(11)"]').type('6398420');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Verifica Swal de aviso
        cy.get('.swal2-title').should('contain', 'Verifique o número');
        cy.get('.swal2-html-container').should('contain', 'curto');
    });

    it('should show error for invalid characters', () => {
        // Digita letras no lugar de numeros
        cy.get('input[placeholder*="(11)"]').type('abcde12345');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        // Verifica Swal de aviso
        cy.get('.swal2-title').should('contain', 'Verifique o número');
        cy.get('.swal2-html-container').should('contain', 'caracteres inválidos');
        // Nota: Se a validação do input type="text" permitir letras. Se filtramos no onChange, isso pode nem acontecer, mas o teste garante.
    });
});
