import dotenv from "dotenv";
dotenv.config();

import { FinanceAgentService } from "../src/services/FinanceAgentService";
import readline from "readline";

async function main() {
    console.log("🟦 Iniciando Teste do Agente Financeiro (CLI Interactiva)...");
    console.log("💬 Pode falar qualquer coisa (ctrl+c para sair)");

    try {
        const agent = new FinanceAgentService();
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("Checking API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

        const ask = () => {
            rl.question('\n👤 Você: ', async (input) => {
                if (!input) {
                    ask();
                    return;
                }

                process.stdout.write('🤖 Agente: Pensando...');
                const response = await agent.processMessage(input, "test-user-id");

                // Clear "Pensando..."
                readline.cursorTo(process.stdout, 0);
                readline.clearLine(process.stdout, 0);

                console.log(`🤖 Agente: ${response}`);
                ask();
            });
        };

        ask();

    } catch (error) {
        console.error("❌ Erro ao inicializar:", error);
    }
}

main();
