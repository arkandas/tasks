import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, badRequest, serverError } from '@/lib/api-auth'
import { LIMITS, isStickyNoteColor, isFiniteNumber } from '@/lib/validate'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const stickyNotes = await prisma.stickyNote.findMany({
      where: {
        deleted_at: null,
        user_id: userId
      },
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json(stickyNotes)
  } catch (error) {
    console.error('Error fetching sticky notes:', error)
    return serverError('Failed to fetch sticky notes')
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const body = await request.json()
    const { content = '', color, position_x, position_y, width, height, z_index } = body

    if (typeof content !== 'string' || content.length > LIMITS.stickyNote) {
      return badRequest('Invalid content')
    }
    if (color !== undefined && !isStickyNoteColor(color)) {
      return badRequest('Invalid color')
    }
    for (const value of [position_x, position_y, width, height, z_index]) {
      if (value !== undefined && !isFiniteNumber(value)) return badRequest('Invalid position or size')
    }

    const stickyNote = await prisma.stickyNote.create({
      data: {
        content,
        color,
        position_x,
        position_y,
        width: width === undefined ? undefined : Math.round(width),
        height: height === undefined ? undefined : Math.round(height),
        z_index: z_index === undefined ? undefined : Math.round(z_index),
        user_id: userId,
      }
    })

    return NextResponse.json(stickyNote, { status: 201 })
  } catch (error) {
    console.error('Error creating sticky note:', error)
    return serverError('Failed to create sticky note')
  }
}
