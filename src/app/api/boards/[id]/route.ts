import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import { LIMITS, parseId, requiredText, optionalText, isValidOptionalText } from '@/lib/validate'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Board')

    const board = await prisma.board.findFirst({
      where: { id, user_id: userId },
      include: {
        sections: {
          include: {
            tasks: {
              include: { comments: true },
              orderBy: [{ position: 'asc' }, { id: 'asc' }]
            }
          },
          orderBy: [{ position: 'asc' }, { id: 'asc' }]
        }
      }
    })

    if (!board) return notFound('Board')

    return NextResponse.json(board)
  } catch (error) {
    console.error('Error fetching board:', error)
    return serverError('Failed to fetch board')
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Board')

    const body = await request.json()
    const updateData: { title?: string; description?: string | null } = {}

    if (body.title !== undefined) {
      const title = requiredText(body.title, LIMITS.title)
      if (!title) return badRequest('Title is required')
      updateData.title = title
    }

    if ('description' in body) {
      if (!isValidOptionalText(body.description, LIMITS.description)) {
        return badRequest('Description is too long')
      }
      updateData.description = optionalText(body.description, LIMITS.description) ?? null
    }

    const owned = await prisma.board.findFirst({
      where: { id, user_id: userId },
      select: { id: true }
    })
    if (!owned) return notFound('Board')

    const board = await prisma.board.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(board)
  } catch (error) {
    console.error('Error updating board:', error)
    return serverError('Failed to update board')
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Board')

    const { count } = await prisma.board.deleteMany({
      where: { id, user_id: userId }
    })
    if (count === 0) return notFound('Board')

    return NextResponse.json({ message: 'Board deleted successfully' })
  } catch (error) {
    console.error('Error deleting board:', error)
    return serverError('Failed to delete board')
  }
}
