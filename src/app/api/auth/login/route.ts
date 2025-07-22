import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getMongoClient } from '@/db/connectionDb'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: Request) {
  try {
    const { email, cel, password } = await request.json()

      if (!password || (!email && !cel)) {
          return NextResponse.json({ error: 'Email ou celular e senha são obrigatórios.' }, { status: 400 });
      }
    const client = await getMongoClient();

    const db = client.db("financeApp");

    // Find user
      const normalizedPhone = cel?.replace(/\D/g, '');

      // Busca usuário por email ou número de celular
      const user = await db.collection('users').findOne(
          email ? { email } : { cel: { $in: [normalizedPhone] } }
      );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' })
     ;(await
      // Set the token in a secure HTTP-only cookie
      cookies()).set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    })
    return NextResponse.json({ message: 'Login successful', token: token, userId: user._id, tutorialGuide: user.tutorialGuide, executeQuery: user.executeQuery }, { status: 200 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
