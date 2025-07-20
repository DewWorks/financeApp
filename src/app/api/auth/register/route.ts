import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMongoClient } from '@/db/connectionDb';

export async function POST(request: Request) {
  try {
    const { name, email, cel, password } = await request.json()
    const client = await getMongoClient();

    const db = client.db("financeApp");

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new user
    const result = await db.collection('users').insertOne({
      name,
      email,
      cel,
      password: hashedPassword,
      tutorialGuide: false,
      executeQuery: false
    })

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 })
    console.log(result);
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}