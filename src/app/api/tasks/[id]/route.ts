import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Priority } from '@prisma/client'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import {
  LIMITS,
  parseId,
  parseIndex,
  requiredText,
  optionalText,
  isValidOptionalText,
  isPriority,
  parseOptionalDate,
} from '@/lib/validate'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Task')

    const task = await prisma.task.findFirst({
      where: { id, section: { board: { user_id: userId } } },
      include: { comments: true }
    })

    if (!task) return notFound('Task')

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return serverError('Failed to fetch task')
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Task')

    const body = await request.json()
    const updateData: {
      title?: string
      description?: string | null
      priority?: Priority
      position?: number
      deadline?: Date | null
      completed?: boolean
    } = {}

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

    if (body.priority !== undefined) {
      if (!isPriority(body.priority)) return badRequest('Invalid priority')
      updateData.priority = body.priority
    }

    if (body.position !== undefined) {
      const position = parseIndex(body.position)
      if (position === null) return badRequest('Invalid position')
      updateData.position = position
    }

    if (body.deadline !== undefined) {
      const deadline = parseOptionalDate(body.deadline)
      if (deadline === 'invalid') return badRequest('Invalid deadline')
      updateData.deadline = deadline ?? null
    }

    if (body.completed !== undefined) {
      if (typeof body.completed !== 'boolean') return badRequest('Invalid completed value')
      updateData.completed = body.completed
    }

    const owned = await prisma.task.findFirst({
      where: { id, section: { board: { user_id: userId } } },
      select: { id: true }
    })
    if (!owned) return notFound('Task')

    const task = await prisma.task.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return serverError('Failed to update task')
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Task')

    const { count } = await prisma.task.deleteMany({
      where: { id, section: { board: { user_id: userId } } }
    })
    if (count === 0) return notFound('Task')

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return serverError('Failed to delete task')
  }
}
