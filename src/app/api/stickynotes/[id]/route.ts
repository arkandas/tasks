import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { StickyNoteColor } from '@prisma/client'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import { LIMITS, parseId, isStickyNoteColor, isFiniteNumber } from '@/lib/validate'

type Context = { params: Promise<{ id: string }> }

const TRASH_LIMIT = 50

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Sticky note')

    const stickyNote = await prisma.stickyNote.findFirst({
      where: { id, user_id: userId }
    })

    if (!stickyNote) return notFound('Sticky note')

    return NextResponse.json(stickyNote)
  } catch (error) {
    console.error('Error fetching sticky note:', error)
    return serverError('Failed to fetch sticky note')
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Sticky note')

    const body = await request.json()
    const updateData: {
      content?: string
      color?: StickyNoteColor
      position_x?: number
      position_y?: number
      width?: number
      height?: number
      z_index?: number
    } = {}

    if (body.content !== undefined) {
      if (typeof body.content !== 'string' || body.content.length > LIMITS.stickyNote) {
        return badRequest('Invalid content')
      }
      updateData.content = body.content
    }

    if (body.color !== undefined) {
      if (!isStickyNoteColor(body.color)) return badRequest('Invalid color')
      updateData.color = body.color
    }

    for (const key of ['position_x', 'position_y'] as const) {
      if (body[key] === undefined) continue
      if (!isFiniteNumber(body[key])) return badRequest('Invalid position')
      updateData[key] = body[key]
    }

    for (const key of ['width', 'height', 'z_index'] as const) {
      if (body[key] === undefined) continue
      if (!isFiniteNumber(body[key])) return badRequest('Invalid size')
      updateData[key] = Math.round(body[key])
    }

    const owned = await prisma.stickyNote.findFirst({
      where: { id, user_id: userId },
      select: { id: true }
    })
    if (!owned) return notFound('Sticky note')

    const stickyNote = await prisma.stickyNote.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(stickyNote)
  } catch (error) {
    console.error('Error updating sticky note:', error)
    return serverError('Failed to update sticky note')
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Sticky note')

    const { count } = await prisma.stickyNote.updateMany({
      where: { id, user_id: userId },
      data: { deleted_at: new Date() }
    })
    if (count === 0) return notFound('Sticky note')

    const overflow = await prisma.stickyNote.findMany({
      where: { user_id: userId, deleted_at: { not: null } },
      orderBy: { deleted_at: 'desc' },
      skip: TRASH_LIMIT,
      select: { id: true }
    })

    if (overflow.length > 0) {
      await prisma.stickyNote.deleteMany({
        where: { id: { in: overflow.map(note => note.id) } }
      })
    }

    return NextResponse.json({ message: 'Sticky note moved to trash' })
  } catch (error) {
    console.error('Error deleting sticky note:', error)
    return serverError('Failed to delete sticky note')
  }
}
