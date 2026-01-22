# Guia de Testes - FinanceApp

Este projeto utiliza uma estratégia de testes dividida em **Unitários**, **Integração** e **E2E (Ponta a Ponta)**.

## Estrutura de Pastas
```
tests/
├── cypress/        # Testes de Interface (E2E)
│   └── e2e/        # Cenários de usuário (Login, Dash, etc)
└── jest/           # Testes Automatizados (Backend/Lógica)
    ├── unit/       # Testes isolados (Funções puras, utils)
    └── integration/# Testes de API com Banco de Dados (Memória)
```

## Comandos Principais

### 1. Rodar TUDO (Recomendado)
Verifica a saúde geral do sistema (Lógica + API).
```bash
npm test
```

### 2. Rodar por Tipo
Se quiser focar em uma área específica:

**Unitários (Rápido)**:
```bash
npx vitest run tests/jest/unit
```

**Integração (API)**:
```bash
npx vitest run tests/jest/integration
```

**Interface (Visual/Cypress)**:
```bash
npm run cypress
```

### Testes com Cypress e Jest

- **Cypress (Teste de Interface)**:
  O Cypress é uma ferramenta de teste end-to-end (E2E) usada para verificar a interação do usuário com a interface da aplicação. 
  
  No teste com Cypress, a funcionalidade de **adicionar uma transação** foi verificada, incluindo o preenchimento de um formulário, a submissão e a confirmação de que os dados foram corretamente exibidos na tela. 
  
  O ***Cypress*** **facilita testes de interface devido à sua fácil configuração, integração rápida e uma documentação amigável.**

- **Jest (Teste de Integração)**:
  O Jest é uma framework de testes para JavaScript, focada em testes unitários e de integração. O teste com Jest foi usado para simular e verificar operações de banco de dados usando **MongoDB em memória**. 
  
  O ***Jest*** **é ideal para testes de integração, pois permite a simulação de ambientes de banco de dados e a verificação das interações sem a necessidade de uma instância real de banco de dados.**

### Por que usar Cypress e Jest?
- **Cypress** é utilizado para garantir que a interface da aplicação funcione corretamente, simulando interações reais de usuários de forma simples e eficaz.

- **Jest** é escolhido para realizar testes de integração, permitindo simular operações do banco de dados de forma controlada e garantir a funcionalidade da lógica de backend.
  
  
  Ambas as ferramentas se integram facilmente, oferecendo testes robustos para garantir a qualidade do código tanto no frontend quanto no backend.