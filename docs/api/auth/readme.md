# Documentação da API de Autenticação

## Visão Geral

A API de Autenticação é responsável por autenticar usuários e gerar tokens JWT para acesso seguro à aplicação de controle financeiro.

## Endpoint

### POST /api/login

Autentica um usuário e gera um token JWT.

- **Corpo da Requisição**: 
  ```json
  {
    "email": "usuario@exemplo.com",
    "senha": "senhadousuario"
  }
  ```
- **Resposta**: Mensagem de sucesso e define o cookie `auth_token`

## Como Funciona

1. **Busca do Usuário**: A API procura por um usuário com o email fornecido no banco de dados.

2. **Verificação de Senha**: Se um usuário for encontrado, a senha fornecida é comparada com a senha hash armazenada usando bcrypt.

3. **Geração de Token**: Após a autenticação bem-sucedida, um token JWT é gerado contendo o ID do usuário.

4. **Configuração do Cookie**: O token gerado é definido como um cookie HTTP-only chamado `auth_token`. Este cookie é seguro (em produção), strict same-site e expira após 1 dia.

## Medidas de Segurança

- As senhas são hash usando bcrypt antes do armazenamento
- Os tokens JWT são assinados com uma chave secreta
- Os tokens são armazenados em cookies HTTP-only para prevenir ataques XSS
- A flag secure é definida nos cookies em ambiente de produção

## Exemplo de Uso

```javascript
const credenciais = {
  email: 'usuario@exemplo.com',
  senha: 'minhasenha123'
};

const response = await fetch('/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(credenciais)
});

if (response.ok) {
  console.log('Login bem-sucedido');
  // O token JWT será automaticamente armazenado no cookie
} else {
  console.error('Falha no login');
}
```

## Tratamento de Erros

A API inclui tratamento de erros para:
- Usuário não encontrado
- Senha inválida
- Erros internos do servidor

Todos os erros são registrados no console do servidor e respostas apropriadas são enviadas ao cliente.

---
