# Testes End-to-End de Login com Telefone

Estes testes simulam um usuário real interagindo com a página de Login (`/auth/login`) para garantir que a validação visual e o fluxo de sucesso funcionem com diversos formatos de telefone.

## Cenários Cobertos

1.  **Login com Número Local (`63984207313`)**
    -   **Objetivo**: Garantir que o usuário pode digitar apenas os números com DDD e conseguir logar.
    -   **Expectativa**: Swal de "Sucesso".

2.  **Login com Número Formatado (`(63) 98420-7313`)**
    -   **Objetivo**: Garantir que o input aceita caracteres de formatação comuns.
    -   **Expectativa**: Swal de "Sucesso".

3.  **Erro de Número Curto**
    -   **Ação**: Digitar número incompleto (ex: 7 dígitos).
    -   **Expectativa**: Swal de erro avisando que o número é "muito curto" e sugerindo incluir DDD/9º dígito.

4.  **Erro de Caracteres Inválidos**
    -   **Ação**: Digitar letras onde deveria ser telefone.
    -   **Expectativa**: Feedback visual de erro de formato.

## Como Rodar
```bash
npx cypress run --spec "cypress/e2e/auth/login_phone.cy.ts"
```
