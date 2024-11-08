import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value

  // Rotas que não precisam de autenticação
  const publicPaths = ['/login', '/register']
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    jwt.verify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (error) {
    console.error('Invalid or expired JWT token:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}