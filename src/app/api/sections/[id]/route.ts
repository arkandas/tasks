import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import { LIMITS, parseId, parseIndex, requiredText } from '@/lib/validate'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Section')

    const section = await prisma.section.findFirst({
      where: { id, board: { user_id: userId } },
      include: {
        tasks: {
          include: { comments: true },
          orderBy: [{ position: 'asc' }, { id: 'asc' }]
        }
      }
    })

    if (!section) return notFound('Section')

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error fetching section:', error)
    return serverError('Failed to fetch section')
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Section')

    const body = await request.json()
    const updateData: { title?: string; position?: number } = {}

    if (body.title !== undefined) {
      const title = requiredText(body.title, LIMITS.title)
      if (!title) return badRequest('Title is required')
      updateData.title = title
    }

    if (body.position !== undefined) {
      const position = parseIndex(body.position)
      if (position === null) return badRequest('Invalid position')
      updateData.position = position
    }

    const owned = await prisma.section.findFirst({
      where: { id, board: { user_id: userId } },
      select: { id: true }
    })
    if (!owned) return notFound('Section')

    const section = await prisma.section.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(section)
  } catch (error) {
    console.error('Error updating section:', error)
    return serverError('Failed to update section')
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Section')

    const { count } = await prisma.section.deleteMany({
      where: { id, board: { user_id: userId } }
    })
    if (count === 0) return notFound('Section')

    return NextResponse.json({ message: 'Section deleted successfully' })
  } catch (error) {
    console.error('Error deleting section:', error)
    return serverError('Failed to delete section')
  }
}
