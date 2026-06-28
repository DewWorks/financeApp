/**
 * Prompts e schemas centralizados para o pipeline de extração de transações via IA.
 *
 * Otimizado para modelos pequenos (Qwen/Llama 8B) com temperature=0.
 * Todas as instruções em Português (Brasil).
 */

import { expenseTags, incomeTags } from "@/interfaces/ITransaction";

// ---------------------------------------------------------------------------
// Tags válidas
// ---------------------------------------------------------------------------

/** Todas as tags válidas do sistema (despesas + receitas + transferência) */
export const ALL_VALID_TAGS = [
  ...expenseTags,
  ...incomeTags.filter((t) => t !== "Outros"), // evita duplicata de "Outros"
  "Transferência",
] as const;

export type ValidTag = (typeof ALL_VALID_TAGS)[number];

// ---------------------------------------------------------------------------
// JSON Schema da extração
// ---------------------------------------------------------------------------

export const EXTRACTION_JSON_SCHEMA = {
  type: "object" as const,
  properties: {
    type: {
      type: "string" as const,
      enum: ["income", "expense", "transfer"] as const,
    },
    description: { type: "string" as const },
    amount: { type: "number" as const },
    date: {
      type: "string" as const,
      description:
        "Data em ISO 8601 (YYYY-MM-DD) ou palavra-chave relativa: TODAY, YESTERDAY",
    },
    tag: {
      type: "string" as const,
      enum: ALL_VALID_TAGS as unknown as string[],
    },
    confidence: {
      type: "number" as const,
      minimum: 0,
      maximum: 1,
    },
  },
  required: [
    "type",
    "description",
    "amount",
    "date",
    "tag",
    "confidence",
  ] as const,
};

// ---------------------------------------------------------------------------
// System Prompt (conciso, otimizado para modelos pequenos)
// ---------------------------------------------------------------------------

export const EXTRACTION_SYSTEM_PROMPT = `Você é um extrator de dados financeiros. Extraia UMA transação do texto transcrito.

REGRAS DE TIPO:
1. "expense" — gasto, compra, pagamento, conta, débito
2. "income" — salário, recebimento, venda, freelance, investimento
3. "transfer" — transferência entre contas próprias, pagamento de fatura de cartão

REGRAS DE TAG:
- Transporte: Uber, 99, combustível, posto, estacionamento, ônibus, metrô
- Alimentação: iFood, restaurante, supermercado, padaria, lanche, café
- Custos de Vida: luz, água, internet, celular, gás, IPTU, condomínio
- Aluguel: aluguel, rent
- Utensílios: móveis, eletrodomésticos, utensílios domésticos
- Lazer: Netflix, Spotify, cinema, bar, viagem, jogo, streaming
- Saúde: farmácia, médico, dentista, plano de saúde, exame
- Educação: curso, escola, faculdade, livro, Udemy, Alura
- Salário: salário, holerite, pagamento recebido (apenas income)
- Freelancer: freelance, trabalho extra, serviço prestado (apenas income)
- Venda: venda de item, produto vendido (apenas income)
- Presente: presente recebido, doação recebida (apenas income)
- Investimentos: rendimento, dividendo, CDB, ações (apenas income)
- Transferência: PIX entre contas, TED própria, pagamento fatura cartão (apenas transfer)
- Outros: quando nenhuma tag acima se aplica

REGRAS DE DATA:
- "hoje" / "agora" → TODAY
- "ontem" → YESTERDAY
- "anteontem" → dia atual - 2
- "segunda passada" / "última segunda" → LAST_MONDAY
- "terça passada" → LAST_TUESDAY
- "quarta passada" → LAST_WEDNESDAY
- "quinta passada" → LAST_THURSDAY
- "sexta passada" → LAST_FRIDAY
- "sábado passado" → LAST_SATURDAY
- "domingo passado" → LAST_SUNDAY
- Data explícita → formato YYYY-MM-DD
- Sem menção de data → TODAY

REGRAS DE VALOR:
- Extraia o valor numérico (sem R$, sem pontos de milhar). Use ponto como separador decimal.
- "cem reais" = 100, "mil e quinhentos" = 1500, "vinte e cinco e cinquenta" = 25.50
- Valores são sempre positivos.

RESPONDA APENAS com JSON válido, sem texto adicional. Siga exatamente o schema:
{"type":"...","description":"...","amount":0.00,"date":"...","tag":"...","confidence":0.0}

confidence: 0.0 a 1.0 indicando sua certeza na extração.
- >= 0.8: dados claros e inequívocos
- 0.5–0.79: alguma inferência necessária
- < 0.5: dados muito ambíguos`;

// ---------------------------------------------------------------------------
// Construtor do prompt do usuário
// ---------------------------------------------------------------------------

/**
 * Monta o prompt final combinando contexto do sistema com o texto transcrito.
 * Inclui a data atual para resolução de datas relativas.
 */
export function buildExtractionPrompt(transcribedText: string): string {
  const now = new Date();
  const todayISO = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const weekday = now.toLocaleDateString("pt-BR", { weekday: "long" });

  return (
    `Data de hoje: ${todayISO} (${weekday}).\n\n` +
    `Texto transcrito:\n"${transcribedText.trim()}"\n\n` +
    `Extraia a transação financeira do texto acima. Responda APENAS com JSON.`
  );
}

// ---------------------------------------------------------------------------
// Resolução de datas relativas
// ---------------------------------------------------------------------------

/** Mapa de dia da semana (em inglês, getDay()) para offset a partir de domingo */
const DAY_MAP: Record<string, number> = {
  LAST_SUNDAY: 0,
  LAST_MONDAY: 1,
  LAST_TUESDAY: 2,
  LAST_WEDNESDAY: 3,
  LAST_THURSDAY: 4,
  LAST_FRIDAY: 5,
  LAST_SATURDAY: 6,
};

/**
 * Converte strings de data relativas (TODAY, YESTERDAY, LAST_MONDAY, etc.)
 * para formato ISO 8601 (YYYY-MM-DD).
 *
 * Se a string já estiver em formato YYYY-MM-DD, retorna como está.
 */
export function resolveRelativeDate(dateStr: string): string {
  const trimmed = dateStr.trim().toUpperCase();

  // Já é ISO 8601 (YYYY-MM-DD)?
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const now = new Date();

  if (trimmed === "TODAY") {
    return formatDate(now);
  }

  if (trimmed === "YESTERDAY") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return formatDate(d);
  }

  // LAST_<WEEKDAY>
  if (trimmed in DAY_MAP) {
    const targetDay = DAY_MAP[trimmed];
    const currentDay = now.getDay(); // 0=domingo
    // Quantos dias atrás?  Se hoje == targetDay, volta 7 dias (semana passada).
    let diff = currentDay - targetDay;
    if (diff <= 0) {
      diff += 7;
    }
    const d = new Date(now);
    d.setDate(d.getDate() - diff);
    return formatDate(d);
  }

  // Fallback: retorna a string original (pode já ser uma data válida)
  console.warn(
    `[resolveRelativeDate] Não foi possível resolver a data relativa: "${dateStr}". Retornando como está.`
  );
  return dateStr;
}

/** Formata Date para YYYY-MM-DD */
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
