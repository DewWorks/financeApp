# Documentação dos Testes Unitários

Estes testes cobrem a lógica central de validação e formatação de telefones definida em `src/lib/phoneUtils.ts`.

## Casos de Teste (`phoneUtils.test.ts`)

### 1. Formatação (`formatToE164`)
Testamos se o sistema converte corretamente diferentes entradas para o padrão **E.164** (`+55...`), que é o formato utilizado pelo banco de dados.
- **Entrada Local**: `63984207313` -> `+5563984207313`
- **Entrada Formatada**: `(63) 98420-7313` -> `+5563984207313`
- **Entrada Internacional**: `+1 415...` -> Mantém formato internacional.
- **Entrada Inválida**: `abc` -> Retorna `null`.

### 2. Validação Detalhada (`validatePhoneDetails`)
Verificamos se a função retorna não apenas `true/false`, mas o **motivo** do erro para feedback ao usuário.
- **Válido**: Retorna `{ isValid: true }`.
- **Curto**: Retorna `{ error: 'TOO_SHORT' }` ou `INVALID_LENGTH` (ex: faltou dígito).
- **Não Numérico**: Retorna `{ error: 'NOT_A_NUMBER' }`.

### 3. Variações de Busca (`getPhoneQueryVariations`)
Testamos a geração de variações para garantir que o login encontre o usuário independentemente de como ele digite.
- Se usuário digita `(63) 9...`, o sistema busca por: `+5563...`, `5563...`, `63...`.

## Como Rodar
```bash
npm test
```
```
