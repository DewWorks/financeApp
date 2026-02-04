import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value

    // Admin Routes Protection
    if (request.nextUrl.pathname.startsWith('/api/admin')) {
        if (!token) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        try {
            const secret = new TextEncoder().encode(JWT_SECRET)
            const { payload } = await jwtVerify(token, secret)

            if (!payload.isAdmin) {
                return NextResponse.json(
                    { error: 'Admin access required' },
                    { status: 403 } // Forbidden
                )
            }

            return NextResponse.next()
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }
    }

    // Allow other routes
    return NextResponse.next()
}

export const config = {
    matcher: [
        // Apply to all /api/admin routes
        '/api/admin/:path*',
    ],
}
