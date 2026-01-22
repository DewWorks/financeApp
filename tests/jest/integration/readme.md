# Documentação dos Testes de Integração

Os testes de integração verificam o funcionamento das **Rotas da API** (`src/app/api/*`) em conjunto com um banco de dados simulado.

## Tecnologias
- **MongoMemoryServer**: Sobe um banco de dados temporário na memória RAM para cada teste. Isso garante que os testes não afetem o banco real e sejam rápidos.
- **Mocks**:
    - `next/headers`: Simulamos cookies de autenticação (`auth_token`) para testar rotas protegidas.

## Casos de Teste

### 1. Autenticação (`auth_register.test.ts`)
Valida o fluxo de cadastro de novos usuários.
- **Sucesso**: Envia payload válido -> Verifica se usuário foi criado no banco com senha criptografada (hash).
- **Erro (Duplicidade)**: Tenta cadastrar email existente -> Verifica se retorna erro 400.

### 2. Transações Financeiras (`transactions.test.ts`)
Valida as operações principais do sistema financeiro.
- **Criação (POST)**:
    - Envia uma despesa/receita.
    - O teste injeta um **Token JWT Válido** nos cookies.
    - Verifica se a transação foi salva no banco vinculada ao usuário correto.
- **Listagem (GET)**:
    - Busca transações do mês.
    - Verifica se a API retorna a lista correta e a paginação.

## Como Rodar
Para rodar apenas os testes de integração:
```bash
npx vitest run tests/jest/integration
```