import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Rotas que não precisam de autenticação JWT
const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-code',
    '/api/auth/verify-whatsapp',
    '/api/auth/mfa/verify', // Pode precisar verificar sem token completo, dependendo do fluxo
    '/api/webhooks/pluggy',
    '/api/webhooks/whatsapp',
    '/api/payments/webhook',
    '/api/health',
    '/api/cron/autonomous-agent',
    '/api/cron/backup',
    '/api/cron/daily-smart-digest',
    '/api/cron/finscore',
    '/api/cron/goal-tracker',
    '/api/cron/recurring-detector',
    '/api/cron/weekly-brief',
    '/api/doc',
    '/api/whatsapp/transactions',
    // ... adicione outras conforme necessidade
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Apenas intercepta rotas da API
    if (pathname.startsWith('/api/')) {
        // Ignora rotas públicas
        if (publicPaths.some(path => pathname.startsWith(path))) {
            return NextResponse.next();
        }

        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized: No token provided' },
                { status: 401 }
            );
        }

        try {
            // Verifica o token usando jose (Edge compatible)
            const secret = new TextEncoder().encode(JWT_SECRET);
            await jwtVerify(token, secret);
            
            return NextResponse.next();
        } catch (error) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid token' },
                { status: 401 }
            );
        }
    }

    // Para páginas normais, deixa o componente (layout/page) ou next-auth lidar com a proteção,
    // mas garante os headers de segurança (apesar do next.config.js já fazer isso)
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public/ (public files)
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
