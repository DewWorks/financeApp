import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function sendResult(message: string, label: string) {
    const PORT = process.env.PORT || 3000;
    const URL = `http://localhost:${PORT}/api/webhooks/whatsapp`;

    // Seu número real para garantir que encontre o usuário no banco
    const YOUR_NUMBER = 'whatsapp:+5563984207313';

    console.log(`\n🤖 [TESTE: ${label}] Enviando: "${message}"`);
    console.log("---------------------------------------------------");

    const params = new URLSearchParams();
    params.append('From', YOUR_NUMBER);
    params.append('Body', message);

    try {
        const response = await fetch(URL, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const text = await response.text();

        // Simples parser para extrair o texto da resposta XML do Twilio
        const match = text.match(/<Message>(.*?)<\/Message>/s);
        const reply = match ? match[1] : text;

        console.log(`💬 Resposta do Fin:\n${reply.trim()}`);

    } catch (error) {
        console.error("❌ Erro:", error);
    }
}

async function runScenario() {
    console.log("🚀 Iniciando Simulação de Fluxo Completo");

    // 1. Registrar um Gasto
    await sendResult("Quanto eu gastei essa semana?", "CONSULTAR SALDO");

    // Pequena pausa para garantir que o banco salvou
    await new Promise(r => setTimeout(r, 2000));

    // 2. Consultar Gastos
    await sendResult("Quanto gastei esse mês?", "CONSULTAR SALDO");
}

runScenario();
