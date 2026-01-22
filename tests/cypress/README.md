# Testes E2E com Cypress

Os testes End-to-End (E2E) simulam um usuário real navegando pela aplicação. Utilizamos o **Cypress** para automatizar cliques, preenchimento de formulários e verificações visuais.

## Estrutura de Pastas

```
cypress/e2e/
├── auth/
│   └── register.cy.ts     # Fluxo de criação de conta
├── dashboard/
│   └── home.cy.ts         # Verificação de saldos e gráficos
└── transactions/
    └── crud.cy.ts         # Adicionar, Editar e Listar transações
```

## Cenários Cobertos

### 1. Cadastro (`auth/register.cy.ts`)
- Acessa a página de registro.
- Preenche formulário com dados únicos (Email/Telefone dinâmicos).
- Verifica se o cadastro foi bem sucedido (redirecionamento/mensagem).
- Valida erro de senhas diferentes.

### 2. Transações (`transactions/crud.cy.ts`)
- Simula um fluxo completo de "Dia a Dia".
- Faz Login.
- Abre o modal de "Nova Transação".
- Adiciona uma Receita de R$ 5.000,00.
- Confere se o valor apareceu na listagem.

### 3. Dashboard (`dashboard/home.cy.ts`)
- Verifica se a Home carrega corretamente.
- Garante que os cards de saldo (Receita, Despesa, Total) são visíveis.
- Testa a navegação entre meses.

## Pré-requisitos
> [!IMPORTANT]
> A aplicação precisa estar rodando localmente para os testes funcionarem.
> Abra um terminal e rode:
> ```bash
> npm run dev
> ```
> Mantenha esse terminal aberto enquanto roda o Cypress.

## Como Rodar

### Modo Interativo (Interface visual)
Abre uma janela onde você vê o robô clicando. Ideal para desenvolvimento.
```bash
npm run cypress
```

### Modo Headless (Terminal)
Roda tudo por baixo dos panos e só mostra o resultado final. Ideal para CI/CD ou verificação rápida.
```bash
npx cypress run
```
