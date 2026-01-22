const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        baseUrl: 'https://finance-app-tau-flax.vercel.app/',
        specPattern: 'tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: false,
        setupNodeEvents(on, config) {
            // Registra tarefas se necessário (mantendo a estrutura para futuros plugins/seeds)
            on('task', {
                async log(message) {
                    console.log(message);
                    return null;
                },
            });
        },
    },
});
