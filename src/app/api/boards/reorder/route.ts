import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import { parseId, parseIndex, moveItem } from '@/lib/validate'

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const body = await request.json()
    const boardId = parseId(body.boardId)
    const newPosition = parseIndex(body.newPosition)

    if (!boardId || newPosition === null) {
      return badRequest('Invalid board ID or position')
    }

    const boards = await prisma.board.findMany({
      where: { user_id: userId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
      select: { id: true }
    })

    const boardIndex = boards.findIndex(b => b.id === boardId)
    if (boardIndex === -1) return notFound('Board')

    const reordered = moveItem(boards, boardIndex, newPosition)

    await prisma.$transaction(
      reordered.map((board, index) =>
        prisma.board.update({
          where: { id: board.id },
          data: { position: index }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering boards:', error)
    return serverError('Failed to reorder boards')
  }
}
