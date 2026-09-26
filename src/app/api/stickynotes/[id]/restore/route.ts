import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, serverError } from '@/lib/api-auth'
import { parseId } from '@/lib/validate'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Sticky note')

    const { count } = await prisma.stickyNote.updateMany({
      where: { id, user_id: userId },
      data: { deleted_at: null }
    })
    if (count === 0) return notFound('Sticky note')

    const stickyNote = await prisma.stickyNote.findUnique({ where: { id } })
    return NextResponse.json(stickyNote)
  } catch (error) {
    console.error('Error restoring sticky note:', error)
    return serverError('Failed to restore sticky note')
  }
}
