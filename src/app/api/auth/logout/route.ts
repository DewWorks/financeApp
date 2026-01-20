import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user
 *     description: Clears the authentication cookie.
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
export async function POST() {
  (await cookies()).delete('auth_token')
  return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 })
}