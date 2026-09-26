import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getUserId(): Promise<number | null> {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const id = Number(session.user.id)
  return Number.isInteger(id) ? id : null
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function notFound(what: string) {
  return NextResponse.json({ error: `${what} not found` }, { status: 404 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 })
}
