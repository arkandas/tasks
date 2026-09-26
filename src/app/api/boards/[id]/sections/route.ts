import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, serverError } from '@/lib/api-auth'
import { parseId } from '@/lib/validate'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const boardId = parseId((await params).id)
    if (!boardId) return notFound('Board')

    const board = await prisma.board.findFirst({
      where: { id: boardId, user_id: userId },
      select: { id: true }
    })
    if (!board) return notFound('Board')

    const sections = await prisma.section.findMany({
      where: { board_id: boardId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }]
    })

    return NextResponse.json(sections)
  } catch (error) {
    console.error('Error fetching sections:', error)
    return serverError('Failed to fetch sections')
  }
}
