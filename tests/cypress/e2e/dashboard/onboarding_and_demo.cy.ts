describe('Onboarding Tutorial & Demo Mode', () => {

    beforeEach(() => {
        // Clear cookies and localStorage to ensure clean state
        cy.clearCookies();
        cy.clearAllLocalStorage();
    });

    it('Deve exibir o tutorial automaticamente no primeiro acesso sem login', () => {
        cy.visit('/');
        
        // O tutorial deve iniciar automaticamente após o loading sumir
        cy.get('.driver-popover', { timeout: 10000 }).should('be.visible');
        cy.get('.driver-popover-title').should('contain', 'Gestão Inteligente');
        
        // Fecha o tutorial clicando no botão fechar do driver.js
        cy.get('.driver-popover-close-btn').click({ force: true });
    });

    it('Deve exibir o popup de boas-vindas se o tutorial já foi concluído sem login', () => {
        // Configura localStorage indicando que o tutorial foi concluído
        cy.window().then((win) => {
            win.localStorage.setItem('tutorial-guide-v2', 'true');
        });

        cy.visit('/');

        // O popup de boas-vindas deve aparecer
        cy.contains('Bem-vindo', { timeout: 10000 }).should('be.visible');
        cy.contains('Para acessar todas as funcionalidades').should('be.visible');
    });

    it('Deve permitir reiniciar o tutorial a partir do popup de boas-vindas', () => {
        cy.window().then((win) => {
            win.localStorage.setItem('tutorial-guide-v2', 'true');
        });

        cy.visit('/');

        // Aguarda o popup de boas-vindas aparecer
        cy.contains('Bem-vindo', { timeout: 10000 }).should('be.visible');

        // Clica em "Ver Tour / Tutorial de IA"
        cy.contains('Ver Tour / Tutorial de IA').click();

        // O tutorial deve começar de novo
        cy.get('.driver-popover', { timeout: 10000 }).should('be.visible');
        cy.get('.driver-popover-title').should('contain', 'Gestão Inteligente');
    });

    it('Deve permitir continuar como visitante a partir do popup de boas-vindas', () => {
        cy.window().then((win) => {
            win.localStorage.setItem('tutorial-guide-v2', 'true');
        });

        cy.visit('/');

        // Aguarda o popup de boas-vindas aparecer
        cy.contains('Bem-vindo', { timeout: 10000 }).should('be.visible');

        // Clica em "Continuar como Visitante"
        cy.contains('Continuar como Visitante').click();

        // O popup de boas-vindas deve sumir
        cy.contains('Bem-vindo').should('not.exist');
    });

    it('Deve permitir usar o assistente Fin AI no modo demonstração', () => {
        cy.visit('/');

        // Fecha o tutorial
        cy.get('.driver-popover', { timeout: 10000 }).should('be.visible');
        cy.get('.driver-popover-close-btn').click({ force: true });
        
        // Fecha o SweetAlert de tour concluído clicando em "Continuar Testando"
        cy.get('.swal2-container', { timeout: 5000 }).should('be.visible');
        cy.contains('button', 'Continuar Testando').click();

        // Opcional: Fecha o popup de boas-vindas se aparecer
        cy.get('body').then(($body) => {
            if ($body.text().includes('Continuar como Visitante')) {
                cy.contains('Continuar como Visitante').click({ force: true });
            }
        });

        // Encontra o widget do assistente de voz e digita uma transação fictícia
        cy.get('#voice-assistant-widget').should('be.visible');
        cy.get('#voice-assistant-widget input[placeholder*="Ou digite o comando"]').type('Gastei R$ 45 com almoço hoje');
        cy.get('#voice-assistant-widget button').last().click();

        // O assistente deve responder confirmando que registrou a transação temporária
        cy.contains('Entendido! Processei o seu comando de voz/texto', { timeout: 5000 }).should('be.visible');
    });
});
