
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export interface enrichedTransactionData {
    pluggyTransactionId: string;
    cleanDescription: string;
    category: string;
}

export class AiService {

    static async enrichTransactions(transactions: any[]): Promise<enrichedTransactionData[]> {
        if (!apiKey) {
            console.warn("GEMINI_API_KEY not found. Skipping AI enrichment.");
            return transactions.map(t => ({
                pluggyTransactionId: t.id,
                cleanDescription: t.description,
                category: "Outros"
            }));
        }

        // Limit batch size to avoid token limits.
        const batch = transactions.slice(0, 50);

        const prompt = `
        You are a financial assistant. I will provide a list of bank transactions.
        Your task is to:
        1. Clean the description (remove codes, dates, "Transferencia enviada", etc). Keep it short and readable (e.g., "Uber", "Netflix", "Salário").
        2. Categorize each transaction into ONE of these exact tags (Portuguese):
           - Alimentação
           - Transporte
           - Saúde
           - Lazer
           - Educação
           - Aluguel
           - Custos de Vida
           - Salário
           - Investimentos
           - Outros

        Return a JSON ARRAY where each object has:
        - "id": The "id" from the input.
        - "cleanDescription": The cleaned description.
        - "category": The chosen tag.

        Input JSON:
        ${JSON.stringify(batch.map(t => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
            originalCategory: t.category
        })))}
        `;

        const candidates = [
            "gemini-2.0-flash",           // Stable, likely higher quota
            "gemini-flash-latest",        // Generic latest alias
            "gemini-2.0-flash-lite",      // Lightweight alternative
            "gemini-2.0-flash-exp",       // Experimental (Rate limits likely)
            "gemini-2.5-flash",           // Newer preview
            "gemini-pro"                  // Fallback
        ];

        console.log(`[AiService] Sending batch of ${batch.length} to Gemini...`);

        for (const modelName of candidates) {
            try {
                // console.log(`[AiService] Trying model: ${modelName}`); 
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                return parseResponse(responseText);
            } catch (error: any) {
                // Handle 404 (Not Found) AND 429 (Rate Limit/Quota) by trying next model
                const isNotFound = error.status === 404 || error.message?.includes("404") || error.message?.includes("not found");
                const isRateLimit = error.status === 429 || error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("Quota exceeded");

                if (isNotFound || isRateLimit) {
                    console.warn(`[AiService] Model ${modelName} failed (${isRateLimit ? 'Rate Limit' : 'Not Found'}). Trying next...`);
                    continue;
                }

                console.error(`[AiService] Error with model ${modelName}:`, error.message);
                throw error;
            }
        }

        console.error("[AiService] All models failed.");
        // Fallback to manual if all fail
        return transactions.map(t => ({
            pluggyTransactionId: t.id,
            cleanDescription: t.description,
            category: "Outros"
        }));
    }
}

function parseResponse(responseText: string): enrichedTransactionData[] {
    // Sanitize markdown if present
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    try {
        return JSON.parse(jsonString).map((item: any) => ({
            pluggyTransactionId: item.id,
            cleanDescription: item.cleanDescription,
            category: item.category
        }));
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", responseText);
        throw e;
    }
}
