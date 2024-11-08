# Documentação do Middleware de Autenticação

## Visão Geral

O middleware de autenticação fornece proteção de rotas para a aplicação, garantindo que apenas usuários autenticados possam acessar determinadas partes do sistema.

## Funcionalidade

1. **Extração do Token**: O middleware extrai o token JWT do cookie `auth_token`.

2. **Rotas Públicas**: Certas rotas (por exemplo, '/login', '/register') são isentas de verificações de autenticação.

3. **Verificação do Token**: Para rotas protegidas, o middleware verifica o token JWT usando a chave secreta.

4. **Redirecionamento**: Se nenhum token estiver presente ou o token for inválido, o usuário é redirecionado para a página de login.

## Configuração

O middleware é aplicado a todas as rotas, exceto rotas de API, arquivos estáticos e imagens.

```javascript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

Esta configuração garante que o middleware não interfira com chamadas de API ou servindo ativos estáticos.

## Como Funciona

1. O middleware intercepta todas as requisições que correspondem ao padrão definido no `matcher`.

2. Para cada requisição, ele verifica se a rota atual está na lista de rotas públicas.

3. Se não for uma rota pública, o middleware tenta extrair e verificar o token JWT do cookie `auth_token`.

4. Se o token for válido, a requisição prossegue normalmente.

5. Se o token estiver ausente ou for inválido, o usuário é redirecionado para a página de login.

## Exemplo de Implementação

```javascript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  // Rotas que não precisam de autenticação
  const rotasPublicas = ['/login', '/register']
  if (rotasPublicas.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    jwt.verify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (error) {
    console.error('Token JWT inválido ou expirado:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

## Considerações de Segurança

1. **Segredo JWT**: Mantenha o `JWT_SECRET` seguro e use variáveis de ambiente para armazená-lo.

2. **HTTPS**: Certifique-se de que todas as comunicações sejam feitas via HTTPS em produção.

3. **Expiração do Token**: Configure uma expiração adequada para os tokens JWT para limitar o tempo de vida de sessões comprometidas.

4. **Renovação de Token**: Implemente um mecanismo para renovar tokens antes que expirem para melhorar a experiência do usuário.

5. **Logout**: Implemente um mecanismo de logout que invalide o token no lado do servidor.

6. **Monitoramento**: Implemente logs e monitoramento para detectar atividades suspeitas.

Ao seguir estas práticas e entender como o middleware funciona, você pode garantir que sua aplicação tenha uma camada robusta de segurança, protegendo rotas sensíveis contra acesso não autorizado.

