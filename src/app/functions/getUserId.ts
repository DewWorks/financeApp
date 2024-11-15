
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import {router} from "next/client";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function getUserIdFromToken() {
  const token = (await cookies()).get('auth_token')?.value
  if (!token) {
    router.push('/auth/login')
    throw new Error('No token provided')
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return new ObjectId(decoded.userId)
  } catch (error) {
    console.error('Invalid token:', error)
    throw new Error('Invalid token')
  }
}
