import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, serverError } from '@/lib/api-auth'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const deletedNotes = await prisma.stickyNote.findMany({
      where: {
        deleted_at: { not: null },
        user_id: userId
      },
      orderBy: { deleted_at: 'desc' },
      take: 50
    })
    return NextResponse.json(deletedNotes)
  } catch (error) {
    console.error('Error fetching deleted sticky notes:', error)
    return serverError('Failed to fetch deleted sticky notes')
  }
}

export async function DELETE() {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    await prisma.stickyNote.deleteMany({
      where: {
        deleted_at: { not: null },
        user_id: userId
      }
    })
    return NextResponse.json({ message: 'Trash emptied successfully' })
  } catch (error) {
    console.error('Error emptying trash:', error)
    return serverError('Failed to empty trash')
  }
}
