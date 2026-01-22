describe('Gestão de Transações', () => {

    before(() => {
        const uniqueId = Date.now();
        const email = `user.trans.${uniqueId}@example.com`;
        const password = 'Password123!';

        // 1. Cadastrar usuário novo para teste limpo
        cy.visit('/auth/register');
        cy.get('input[id="name"]').type('User Transactions');
        cy.get('input[id="email"]').type(email);
        cy.get('input[id="cel"]').type(`639${uniqueId.toString().slice(-8)}`);
        cy.get('input[id="password"]').type(password);
        cy.contains('button', 'Cadastrar').click();

        // 2. Fazer Login
        cy.get('.swal2-confirm').click(); // Fecha modal se houver
        cy.url().should('include', '/auth/login');

        cy.get('input[id="emailOrPhone"]').type(email);
        cy.get('input[id="password"]').type(password);
        cy.contains('button', 'Entrar').click();

        // 3. Verifica se entrou na Home
        cy.url().should('eq', Cypress.config().baseUrl + '/');

        // 4. Lidar com o Tutorial (Driver.js popup)
        // O tutorial pode aparecer. Se aparecer, precisamos fechar.
        // Vamos checar se o popover existe e clicar em "Pular" ou "Próximo" até acabar

        // Tenta achar o botão de 'Finalizar' ou 'Próximo' do driver.js
        // Como o tutorial bloqueia a tela, precisamos garantir que ele saia.
        // Vamos tentar setar o localStorage antes? Não, pois é o primeiro login real.
        // Então vamos interagir.

        cy.get('body').then(($body) => {
            if ($body.find('.driver-popover').length > 0) {
                // Opção A: Clicar para fechar (se houver botão de fechar w/ allowClose: true)
                // Opção B: Clicar pelo overlay
                // Opção C: Clicar nos botões 'Próximo' até 'Finalizar'

                // Simples: Clica fora ou busca o botão de fechar.
                // Mas como é um tutorial guiado, vamos clicar em "Próximo" repetidamente ou fechar se tiver X.
                // O driver.js tem overlay.

                // Vamos tentar fechar clicando no X se existir ou no overlay
                cy.get('.driver-close-btn').click();
            }
        });

        // Assegura que o tutorial sumiu (pode ter um swal de 'Tutorial Concluído')
        cy.contains('Tutorial Concluído').should('not.exist'); // Ou se existir clica ok
        cy.get('body').then(($body) => {
            if ($body.find('.swal2-container').length > 0) {
                cy.get('.swal2-confirm').click({ force: true });
            }
        });

        cy.contains('Dashboard').should('be.visible');
    });

    it('Deve adicionar uma Nova Receita', () => {
        // Garante que não tem tutorial na frente
        cy.get('.driver-active-element').should('not.exist');

        // Abre o modal de Nova Receita
        cy.get('#add-transactions button').first().click({ force: true });

        // Confirma se o modal abriu
        cy.contains('Adicionar Receita').should('be.visible');

        // Preenche o formulário
        cy.get('input[id="description"]').type('Salário Cypress');
        cy.get('input[id="amount"]').type('5000');

        // Salvar
        cy.contains('button', 'Salvar').click();

        // Verifica feedback e listagem
        cy.contains('Sucesso').should('be.visible');
        cy.get('.swal2-confirm').click();

        // Verifica se apareceu na tabela
        cy.contains('Salário Cypress').should('be.visible');
        cy.contains('R$ 5.000,00').should('be.visible');
    });
});
