import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import { LIMITS, parseId, requiredText } from '@/lib/validate'

const MAX_SECTIONS = 6

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const body = await request.json()
    const title = requiredText(body.title, LIMITS.title)
    if (!title) return badRequest('Title is required')

    const boardId = parseId(body.board_id)
    if (!boardId) return notFound('Board')

    const board = await prisma.board.findFirst({
      where: { id: boardId, user_id: userId },
      select: { id: true, _count: { select: { sections: true } } }
    })
    if (!board) return notFound('Board')

    if (board._count.sections >= MAX_SECTIONS) {
      return badRequest(`A board can have at most ${MAX_SECTIONS} sections`)
    }

    const last = await prisma.section.findFirst({
      where: { board_id: boardId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const section = await prisma.section.create({
      data: {
        title,
        position: (last?.position ?? -1) + 1,
        board_id: boardId,
      }
    })

    return NextResponse.json(section, { status: 201 })
  } catch (error) {
    console.error('Error creating section:', error)
    return serverError('Failed to create section')
  }
}
