# Documentação da API de Transações

## Visão Geral

A API de Transações é responsável por gerenciar as operações financeiras dos usuários autenticados em nossa aplicação de controle financeiro.

## Interface de Transação

A interface de transação representa a estrutura de uma transação financeira:

```typescript
export interface ITransaction {
  _id?: ObjectId
  userId: ObjectId
  type: 'income' | 'expense'
  description: string
  amount: number
  date: string
  tag: string
}
```

## Endpoints

### GET /api/transactions

Recupera todas as transações do usuário autenticado.

- **Autenticação**: Necessária (token JWT no cookie `auth_token`)
- **Resposta**: Array de objetos ITransacao

### POST /api/transactions

Cria uma nova transação para o usuário autenticado.

- **Autenticação**: Necessária (token JWT no cookie `auth_token`)
- **Corpo da Requisição**: Objeto ITransacao (sem `_id` e `userId`)
- **Resposta**: Mensagem de confirmação e ID da transação inserida

## Como Funciona

1. **Autenticação**: Ambos os endpoints usam a função `getUserIdFromToken()` para verificar o token JWT do usuário e extrair o ID do usuário.

2. **Conexão com o Banco de Dados**: A API usa MongoDB para armazenamento de dados, conectando-se através da função `getMongoClient()`.

3. **GET Transações**:
   - Recupera o ID do usuário do token
   - Consulta o banco de dados para todas as transações pertencentes ao usuário
   - Ordena as transações por data em ordem decrescente
   - Retorna as transações como uma resposta JSON

4. **POST Transação**:
   - Recupera o ID do usuário do token
   - Extrai os dados da transação do corpo da requisição
   - Insere um novo documento de transação no banco de dados, adicionando o `userId` e convertendo a string de data para um objeto Date
   - Retorna uma mensagem de sucesso com o ID da transação inserida

## Tratamento de Erros

Ambos os endpoints incluem blocos try-catch para lidar com possíveis erros:
- Erros relacionados ao token (tokens ausentes ou inválidos)
- Erros de conexão com o banco de dados
- Erros de execução de consulta

Os erros são registrados no console e retornam respostas de erro apropriadas para o cliente.

## Exemplo de Uso

### Recuperando Transações

```javascript
const response = await fetch('/api/transactions', {
  method: 'GET',
  credentials: 'include' // Necessário para enviar cookies
});

if (response.ok) {
  const transacoes = await response.json();
  console.log(transacoes);
} else {
  console.error('Erro ao buscar transações');
}
```

### Adicionando uma Nova Transação

```javascript
const novaTransacao = {
  tipo: 'receita',
  valor: 100.00,
  descricao: 'Venda de produto',
  data: new Date().toISOString(),
  categoria: 'Vendas'
};

const response = await fetch('/api/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(novaTransacao),
  credentials: 'include' // Necessário para enviar cookies
});

if (response.ok) {
  const resultado = await response.json();
  console.log('Transação adicionada com sucesso:', resultado);
} else {
  console.error('Erro ao adicionar transação');
}
```

---
