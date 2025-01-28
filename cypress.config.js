module.exports = {
    e2e: {
        baseUrl: 'https://finance-app-tau-flax.vercel.app/',  // URL da sua aplicação (ajuste conforme necessário)
        specPattern: 'src/tests/cypress/functional/**/*.test.ts',  // Caminho para os testes
        supportFile: false,  // Caminho para o arquivo de suporte, se necessário
        setupNodeEvents(on) {
            // Registra a tarefa 'seedDatabase'
            on('task', {
                async seedDatabase() {
                    // Passo 1: Fazer login e obter o token
                    const loginResponse = await fetch('https://finance-app-tau-flax.vercel.app/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: 'joaovictorpfr@gmail.com',
                            password: '23082005',
                        }),
                    });

                    if (!loginResponse.ok) {
                        throw new Error('Erro ao fazer login');
                    }

                    // Não precisamos capturar o token diretamente, pois ele será salvo no cookie HTTP-only.
                    console.log('Login realizado com sucesso');

                    // Passo 2: Configurar o cookie manualmente
                    // Aqui você simula a resposta do cookie HTTP-only no Cypress.
                    // Isso assume que você tem o valor do token no cookie.
                    const token = 'TOKEN_RECEBIDO_DO_COOKIE'; // Substitua isso pelo token obtido de outra maneira, se necessário.

                    // Definir o cookie manualmente no Cypress
                    cy.setCookie('auth_token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Strict',
                        path: '/',
                        maxAge: 60 * 60 * 24, // 1 dia
                    });

                    // Passo 3: Semear a transação no banco
                    const transaction = {
                        userId: 'id-do-usuario', // Altere para o ID do usuário que foi autenticado, se necessário.
                        type: 'expense', // Pode ser 'income' ou 'expense'
                        description: 'Compra de materiais de escritório',
                        amount: 200.0,
                        date: new Date().toISOString(),
                        tag: 'Outros', // Ou use uma tag da lista de `expenseTags` ou `incomeTags`
                    };

                    const transactionResponse = await fetch('https://finance-app-tau-flax.vercel.app/api/transactions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`, // Use o token obtido do cookie
                        },
                        body: JSON.stringify(transaction),
                    });

                    if (!transactionResponse.ok) {
                        throw new Error('Erro ao semear a transação no banco');
                    }

                    const transactionData = await transactionResponse.json();
                    console.log('Transação semeada com sucesso!', transactionData);

                    return null; // Retorna algo, se necessário
                },
            });
        },
    },
};
