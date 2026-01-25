# Documentação de Testes: PlanService

Estes testes validam a lógica de permissões e limites do `PlanService`, garantindo que usuários de diferentes planos (FREE, PRO, MAX) tenham acesso correto às funcionalidades.

## Arquivo de Teste
`tests/jest/services/PlanService.test.ts`

## Stack de Testes
*   **Framework**: Vitest (Compatível com Jest)
*   **Ambiente**: Node.js
*   **Mocks**:
    *   `src/app/models/User`: Mock do Mongoose para retornar planos variados.
    *   `src/db/connectionDb`: Mock do MongoDB native para simular contagens de transações (limites).

## Execução
O projeto utiliza `vitest` como runner, que é compatível com a sintaxe do Jest. O arquivo de teste foi adaptado para usar `vi.mock` e `vi.fn` mantendo a estrutura lógica dos testes de Jest.

## Casos de Teste Cobertos

### 1. Criação de Transações (`CREATE_TRANSACTION`)
| Plano | Cenário | Resultado Esperado |
| :--- | :--- | :--- |
| **FREE** | Usuário com < 200 transações | ✅ **Sucesso** (Permitido) |
| **FREE** | Usuário com >= 200 transações | ❌ **Erro** `PlanRestrictionError` |
| **PRO** | Qualquer quantidade | ✅ **Sucesso** (Ilimitado) |
| **MAX** | Qualquer quantidade | ✅ **Sucesso** (Ilimitado) |

### 2. Conexão Bancária (`CONNECT_BANK`)
| Plano | Resultado Esperado |
| :--- | :--- |
| **FREE** | ❌ **Erro** (Bloqueado) |
| **PRO** | ❌ **Erro** (Bloqueado) |
| **MAX** | ✅ **Sucesso** (Permitido) |

### 3. Bot de WhatsApp (`USE_WHATSAPP`)
| Plano | Resultado Esperado |
| :--- | :--- |
| **FREE** | ❌ **Erro** (Bloqueado) |
| **PRO** | ✅ **Sucesso** (Permitido) |
| **MAX** | ✅ **Sucesso** (Permitido) |

### 4. Deep Insights (`USE_DEEP_INSIGHTS`)
| Plano | Resultado Esperado |
| :--- | :--- |
| **FREE** | ❌ **Erro** (Bloqueado) |
| **PRO** | ❌ **Erro** (Bloqueado) |
| **MAX** | ✅ **Sucesso** (Permitido) |

### 5. Casos de Borda
*   **Usuário Não Encontrado**: Deve lançar erro genérico.
*   **Assinatura Ausente**: Deve assumir plano FREE e aplicar limites.

## Como Rodar os Testes

```bash
# Rodar apenas os testes do PlanService
npx jest tests/jest/services/PlanService.test.ts

# Rodar em modo watch (desenvolvimento)
npx jest tests/jest/services/PlanService.test.ts --watch
```
