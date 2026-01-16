const fetch = require('node-fetch'); // You might need to install node-fetch or use native fetch in Node 18+

async function testWebhook() {
    const params = new URLSearchParams();
    // Simular dados da Twilio
    params.append('From', 'whatsapp:63984207313'); // TROQUE PELO SEU NÚMERO CADASTRADO NO DB
    params.append('Body', '1800 fatura cartao #fatura'); // Mensagem de teste

    try {
        const response = await fetch('http://localhost:3000/api/webhooks/whatsapp', {
            method: 'POST',
            body: params,
        });

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Response (TwiML):', text);
    } catch (error) {
        console.error('Erro ao conectar com o servidor:', error.message);
    }
}

// Se estiver no Node < 18, descomente a linha do require e instale node-fetch
testWebhook();

console.log("Para rodar este teste:");
console.log("1. Garanta que o servidor está rodando (npm run dev)");
console.log("2. Garanta que existe um usuário no DB com cel '551199999999' (sem o +)");
console.log("3. Execute este script com 'node test-webhook.js'");
