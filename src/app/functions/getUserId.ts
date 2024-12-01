import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import {NextResponse} from "next/server";

export async function getUserIdFromToken() {
  const token = (await cookies()).get('auth_token')?.value
  if (!token) {
    console.log('No token provided, redirecting to login...');
    NextResponse.redirect('/auth/login')
    throw new Error('No token provided');
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (!ObjectId.isValid(decoded.userId)) {
      throw new Error('Invalid userId in token');
    }
    return new ObjectId(decoded.userId);
  } catch (error) {
    console.error('Invalid token or userId:', error);
    throw new Error('Invalid token or userId');
  }
}
