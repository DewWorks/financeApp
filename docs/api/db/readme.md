### Explicação da Configuração de Conexão com o MongoDB

O código fornecido utiliza o `MongoClient` da biblioteca `mongodb` para estabelecer uma conexão com o banco de dados MongoDB. Ele foi projetado para funcionar de forma eficiente em ambientes de desenvolvimento e produção, mantendo a conexão de maneira estável para evitar a reconexão desnecessária.

#### Importação e Declarações Globais

```typescript
import { MongoClient } from 'mongodb'

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}
```

*Explicação*: O `MongoClient` é importado da biblioteca `mongodb` para conectar e interagir com o banco de dados. A declaração global cria uma variável `_mongoClientPromise` que pode ser usada para manter a conexão com o MongoDB no ambiente de desenvolvimento, garantindo que a conexão persista mesmo com a substituição de módulos pelo HMR (Hot Module Replacement).

#### Verificação da Variável de Ambiente

```typescript
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
```

*Explicação*: O código verifica se a variável de ambiente `MONGODB_URI` está definida. Essa variável contém a URI de conexão ao MongoDB. Se a variável estiver ausente, o código lança um erro, indicando que a conexão não pode ser estabelecida sem ela.

#### Opções de Configuração

```typescript
const options: any = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
}
```

*Explicação*: As opções `useUnifiedTopology` e `useNewUrlParser` são configuradas para garantir o uso das versões mais modernas e estáveis das funções de conexão do MongoDB.

#### Inicialização do Cliente MongoDB

```typescript
let client: MongoClient
let clientPromise: Promise<MongoClient>
```

*Explicação*: O `client` e o `clientPromise` são declarados para armazenar a instância do `MongoClient` e a promessa de conexão, respectivamente.

#### Ambiente de Desenvolvimento vs. Produção

```typescript
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}
```

*Explicação*: No ambiente de **desenvolvimento**, a conexão é armazenada em uma variável global (`global._mongoClientPromise`). Isso é útil para manter a mesma conexão ativa durante recarregamentos do módulo. No ambiente **de produção**, essa prática é evitada por questões de desempenho e segurança, criando uma nova instância de `MongoClient` para cada conexão.

#### Função para Obter o Cliente MongoDB

```typescript
export async function getMongoClient(): Promise<MongoClient> {
  try {
    const client = await clientPromise;
    console.log("Conexão ao MongoDB estabelecida com sucesso!");
    return client;
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    throw error;
  }
}
```

*Explicação*: A função `getMongoClient` exportada é uma função assíncrona que retorna a instância do `MongoClient` conectada. Se a conexão falhar, a função captura e registra o erro.

#### Exportação do `clientPromise`

```typescript
export default clientPromise
```

*Explicação*: O `clientPromise` é exportado como um módulo para que a instância do cliente possa ser compartilhada entre diferentes partes da aplicação, evitando a necessidade de estabelecer múltiplas conexões.

---

## Estrutura do Banco de Dados

### Coleção de Usuários (`users`)

A coleção `users` armazena as informações dos usuários da aplicação, incluindo dados essenciais como nome, email e senha (hash).

**Estrutura do documento de usuário:**

```json
{
  "_id": "672d78b58b5d46e5a78bac2e",
  "name": "João Silva",
  "email": "joao.silva@example.com",
  "passwordHash": "hashedpassword123",
  "createdAt": "2024-09-15T10:45:30.000Z",
  "updatedAt": "2024-11-08T05:30:20.000Z"
}
```

*Explicação*: Cada documento de usuário contém um identificador único (`_id`), nome, email e um hash da senha para garantir a segurança. Os campos `createdAt` e `updatedAt` são utilizados para rastrear a criação e atualização do registro.

### Coleção de Transações (`transactions`)

A coleção `transactions` registra todas as transações financeiras dos usuários, categorizadas como `income` (receita) ou `expense` (despesa).

**Estrutura do documento de transação:**

```json
{
  "_id": "672d99996f3239e8dd11f572",
  "type": "expense",
  "description": "Aluguel",
  "amount": 1200,
  "date": "2024-11-08T04:54:46.002Z",
  "tag": "Aluguel",
  "userId": "672d78b58b5d46e5a78bac2e"
}
```

*Explicação*: Cada transação possui um identificador único (`_id`), um tipo (`type`), uma descrição (`description`), o valor (`amount`), uma data (`date`), uma tag (`tag`) e uma referência ao usuário (`userId`) que realizou a transação. O campo `userId` é uma chave estrangeira que vincula a transação ao documento de usuário correspondente.

### Exemplos de Documentos de Transações

1. **Exemplo de Despesa:**
   ```json
   {
     "_id": "672d8d1c58d3d3f9a293785c",
     "type": "expense",
     "description": "Ifood",
     "amount": 400,
     "date": "2024-11-08T04:01:32.009Z",
     "tag": "Alimentação",
     "userId": "672d78b58b5d46e5a78bac2e"
   }
   ```

2. **Exemplo de Receita:**
   ```json
   {
     "_id": "672d31193d0588163ff0eb17",
     "type": "income",
     "description": "Salário como professor",
     "amount": 2900,
     "date": "2024-11-05T09:15:20.000+00:00",
     "tag": "Salário",
     "userId": "672d78b58b5d46e5a78bac2e"
   }
   ```

3. **Outra Despesa:**
   ```json
   {
     "_id": "672d3c76327a334853d14224",
     "type": "expense",
     "description": "Barbeiro",
     "amount": 160,
     "date": "2024-11-03T14:50:10.000+00:00",
     "tag": "Lazer",
     "userId": "672d78b58b5d46e5a78bac2e"
   }
   ```

Aqui está uma explicação detalhada sobre a conexão com o banco de dados MongoDB e a estrutura de dados, incluindo exemplos de transações e usuários

**Explicação**: Esses exemplos mostram como as transações são armazenadas com todas as informações relevantes para facilitar consultas e análises financeiras por usuário.

---

