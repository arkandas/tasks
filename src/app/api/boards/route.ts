import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, badRequest, serverError } from '@/lib/api-auth'
import { LIMITS, requiredText, optionalText, isValidOptionalText } from '@/lib/validate'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const boards = await prisma.board.findMany({
      where: { user_id: userId },
      orderBy: [{ position: 'asc' }, { id: 'asc' }]
    })
    return NextResponse.json(boards)
  } catch (error) {
    console.error('Error fetching boards:', error)
    return serverError('Failed to fetch boards')
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const body = await request.json()
    const title = requiredText(body.title, LIMITS.title)
    if (!title) return badRequest('Title is required')
    if (!isValidOptionalText(body.description, LIMITS.description)) {
      return badRequest('Description is too long')
    }

    const maxPosition = await prisma.board.findFirst({
      where: { user_id: userId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const board = await prisma.board.create({
      data: {
        title,
        description: optionalText(body.description, LIMITS.description) ?? null,
        position: (maxPosition?.position ?? -1) + 1,
        user_id: userId,
      }
    })

    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    console.error('Error creating board:', error)
    return serverError('Failed to create board')
  }
}
