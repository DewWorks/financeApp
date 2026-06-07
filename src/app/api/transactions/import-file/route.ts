import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getMongoClient } from "@/db/connectionDb";
import { ObjectId } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function getUserIdFromToken() {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getUserIdFromToken();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString("base64");
        const mimeType = file.type || "application/octet-stream";

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Chave do Gemini não configurada." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Você é um analista contábil sênior especializado em extratos e faturas de cartão brasileiras (Nubank, Itaú, Bradesco, Inter, etc.).
        Analise o extrato/fatura em anexo e extraia TODAS as transações financeiras.

        Regras de Extração e Limpeza:
        1. Identifique a data da transação e formate no padrão YYYY-MM-DD.
        2. Limpe as descrições removendo códigos de estabelecimentos, datas extras, prefixos como "Compra no cartão de", "Transferência enviada pix", etc. Mantenha apenas o nome limpo do estabelecimento (ex: "Uber", "iFood", "Netflix", "Supermercado Pão de Açúcar").
        3. Identifique o tipo: "expense" (despesa, cobrança, débito) ou "income" (receita, crédito recebido, pagamento de fatura, reembolso).
        4. O valor (amount) deve ser um número positivo de ponto flutuante.
        5. Categorize cada transação de forma estrita em uma destas categorias brasileiras:
           - **Transporte**: combustíveis, pedágio, táxi, Uber, 99.
           - **Alimentação**: restaurantes, supermercados, padarias, iFood, café.
           - **Saúde**: farmácias, consultas, exames, planos de saúde.
           - **Lazer**: streaming, cinemas, bares, shows, jogos, viagens.
           - **Educação**: cursos, faculdade, livros, mensalidades escolares.
           - **Aluguel**: aluguel, condomínio.
           - **Custos de Vida**: contas de água, luz, internet, celular, taxas.
           - **Salário**: salário, pró-labore.
           - **Investimentos**: aportes em corretoras, compra de ativos.
           - **Transferência**: transferências entre próprias contas ou pagamento de fatura (que são movimentações internas).
           - **Outros**: compras de produtos em geral (Amazon, Mercado Livre se não especificado), presentes, etc.

        Retorne ESTRITAMENTE um JSON Array válido de objetos seguindo a seguinte estrutura de propriedades. Não adicione qualquer texto markdown extra (como \`\`\`json):
        [
          {
            "date": "YYYY-MM-DD",
            "description": "Nome do Estabelecimento",
            "amount": 123.45,
            "type": "expense",
            "category": "Alimentação"
          }
        ]

        Se o arquivo não contiver nenhuma transação identificável, retorne um array vazio [].
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                },
            },
            prompt,
        ]);

        const responseText = result.response.text();
        const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        let transactions: any[] = [];
        try {
            transactions = JSON.parse(jsonString);
        } catch (e) {
            console.error("Gemini failed to generate valid JSON:", responseText);
            return NextResponse.json({ error: "Não foi possível estruturar os dados do extrato. Tente outro formato." }, { status: 422 });
        }

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return NextResponse.json({ message: "Nenhuma transação encontrada no arquivo.", importedCount: 0 });
        }

        // Prepare records for database insertion
        const preparedTransactions = transactions.map((t) => ({
            userId: new ObjectId(userId),
            description: t.description || "Transação Importada",
            amount: Number(t.amount) || 0,
            type: t.type === "income" ? "income" : "expense",
            date: t.date ? new Date(t.date) : new Date(),
            tag: t.category || "Outros",
            createdAt: new Date(),
        }));

        const client = await getMongoClient();
        const db = client.db("financeApp");

        const dbResult = await db.collection("transactions").insertMany(preparedTransactions);

        return NextResponse.json({
            message: "Fatura importada com sucesso!",
            importedCount: dbResult.insertedCount,
            transactions: transactions.map(t => `${t.date}: ${t.description} (R$ ${t.amount.toFixed(2)})`),
        });
    } catch (error: any) {
        console.error("[Import File API] Error:", error);
        return NextResponse.json({ error: "Falha interna ao processar o arquivo." }, { status: 500 });
    }
}
