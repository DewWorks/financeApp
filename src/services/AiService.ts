
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cleanTransactionDescription } from "@/lib/sanitizer";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export interface enrichedTransactionData {
    pluggyTransactionId: string;
    cleanDescription: string;
    category: string;
}

export class AiService {

    static async enrichTransactions(transactions: any[], userId?: string): Promise<enrichedTransactionData[]> {
        if (!apiKey) {
            console.warn("GEMINI_API_KEY not found. Skipping AI enrichment.");
            return transactions.map(t => ({
                pluggyTransactionId: t.id,
                cleanDescription: t.description,
                category: "Outros"
            }));
        }

        // =================================================================================
        // TIER 1: MEMORY (Personalization)
        // =================================================================================
        const userMemory = new Map<string, string>();
        let learningContext = "";

        if (userId) {
            try {
                // Import dynamically to avoid circular deps if any (good practice here)
                const { getMongoClient } = await import("@/db/connectionDb");
                const { ObjectId } = await import("mongodb");
                const client = await getMongoClient();
                const db = client.db('financeApp');

                // Fetch last 200 confirmed/edited transactions for this user
                const history = await db.collection('transactions')
                    .find({
                        userId: new ObjectId(userId),
                        tag: { $ne: "Outros" } // Only learn from categorized stuff
                    })
                    .sort({ date: -1 })
                    .limit(200)
                    .toArray();

                // Build Knowledge Base (Description -> Category)
                // We normalize description (lowercase, trim) for better hit rate
                history.forEach(t => {
                    if (t.description && t.tag) {
                        const cleanKey = t.description.trim().toLowerCase();
                        // Prefer most recent (since we sorted desc)
                        if (!userMemory.has(cleanKey)) {
                            userMemory.set(cleanKey, t.tag);
                        }
                    }
                });

                // Build Less-Specific Context for AI (Tier 2)
                const examples = Array.from(userMemory.entries())
                    .slice(0, 30) // Limit context window
                    .map(([desc, cat]) => `"${desc}" -> ${cat}`)
                    .join("\n");

                if (examples) {
                    learningContext = `
                    **USER MEMORY (HIGHEST PRIORITY):**
                    The user has explicitly categorized these descriptions in the past. 
                    - If the new transaction description is SIMILAR to any below, USE THE SAME CATEGORY.
                    - Example: If user mapped "Zezinho Lanches" to "Trabalho", and now sees "Zezinho Lanches Filial", classify as "Trabalho".
                    
                    KNOWN PATTERNS:
                    ${examples}
                    `;
                }

            } catch (error) {
                console.error("[AiService] Failed to fetch learning history:", error);
            }
        }

        // Process Batch with Tier 1 Pre-Check
        const batch = transactions.slice(0, 50);
        const transactionsToEnrich: any[] = [];
        const enrichedByMemory: enrichedTransactionData[] = [];

        for (const t of batch) {
            const cleanKey = t.description?.trim().toLowerCase();
            const memoryMatch = userMemory.get(cleanKey);

            if (memoryMatch) {
                // TIER 1 HIT: Bypass AI
                // console.log(`[AiService] Memory Hit: "${t.description}" -> ${memoryMatch}`);
                enrichedByMemory.push({
                    pluggyTransactionId: t.id,
                    cleanDescription: t.description, // Keep original, or clean if needed? Let's keep original for now to avoid regex complexity duplication
                    category: memoryMatch
                });
            } else {
                transactionsToEnrich.push(t);
            }
        }

        if (transactionsToEnrich.length === 0) {
            return enrichedByMemory;
        }

        // =================================================================================
        // TIER 2 & 3: AI + CONTEXT
        // =================================================================================

        const prompt = `
        You are a financial assistant specialized in Brazilian transaction data.
        
        ${learningContext}

        Your task for the REMAINING transactions is to:
        1. Clean the description (remove codes, dates, "Transferencia enviada", symbols like "*", etc). Keep it short and readable (e.g., "Uber", "Netflix", "Salário", "Posto Ipiranga").
        2. Categorize each transaction into ONE of these exact tags (Portuguese) based on these strict rules:

           - **Transporte**: rideshare apps (Uber, 99, Cabify), fuel (Posto, Abastece), parking (Estapar, Sem Parar), public transit (Bilhete Unico).
           - **Alimentação**: restaurants, delivery apps (iFood, Rappi, Zé Delivery), supermarkets (Pão de Açúcar, Carrefour, Atacadão), bakeries.
           - **Saúde**: pharmacies (Raia, Drogasil), doctors, labs (Fleury), health insurance (Unimed).
           - **Lazer**: streaming (Netflix, Spotify, Prime), cinema, games (Steam, PSN), clubs, bars.
           - **Educação**: schools, courses (Udemy, Alura), books (Amazon if clearly books).
           - **Aluguel**: rent payments, condominium fees (Condominio).
           - **Custos de Vida**: utilities (Enel, Sabesp, Claro, Vivo, Tim), internet.
           - **Salário**: payroll, payments received identified as salary.
           - **Investimentos**: brokerage transfers (XP, Rico, Binance, NuInvest).
           - **Transferência**: Transfers between own accounts (savings, credit card payment).
           - **Outros**: transfers to people (unless identified as service), taxes, unidentified.

        **CRITICAL RULES:**
        - If description contains "Uber" or "99", categorize as **Transporte** (even if via PIX).
        - If description contains "iFood", categorize as **Alimentação**.
        - If description contains "Posto" or "Combustivel", categorize as **Transporte**.
        - Payment of Credit Card Bill (Pagamento Fatura, Cartão) -> **Transferência** (Not Expense!).

        Return a JSON ARRAY where each object has:
        - "id": The "id" from the input.
        - "cleanDescription": The cleaned description.
        - "category": The chosen tag.

        Input JSON:
        ${JSON.stringify(transactionsToEnrich.map(t => ({
            id: t.id,
            description: cleanTransactionDescription(t.description),
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

        console.log(`[AiService] Sending batch of ${transactionsToEnrich.length} to Gemini (${enrichedByMemory.length} served by memory)...`);

        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                const aiEnriched = parseResponse(responseText);
                return [...enrichedByMemory, ...aiEnriched];
            } catch (error: any) {
                // Handle 404/429/etc
                const isNotFound = error.status === 404 || error.message?.includes("404") || error.message?.includes("not found");
                const isRateLimit = error.status === 429 || error.message?.includes("429");

                if (isNotFound || isRateLimit) {
                    console.warn(`[AiService] Model ${modelName} failed (${isRateLimit ? 'Limit' : '404'}). Trying next...`);
                    continue;
                }
                console.error(`[AiService] Error with model ${modelName}:`, error.message);
                // Don't throw immediately, try next model? No, other errors might be fatal.
                // Actually, let's continue for reliability.
                continue;
            }
        }

        console.error("[AiService] All models failed.");
        // Fallback
        return [...enrichedByMemory, ...transactionsToEnrich.map(t => ({
            pluggyTransactionId: t.id,
            cleanDescription: t.description,
            category: "Outros"
        }))];
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
