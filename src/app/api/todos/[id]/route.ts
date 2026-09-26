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
  moveItem,
} from '@/lib/validate'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Todo')

    const todo = await prisma.todoItem.findFirst({
      where: { id, user_id: userId }
    })

    if (!todo) return notFound('Todo')

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error fetching todo:', error)
    return serverError('Failed to fetch todo')
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Todo')

    const body = await request.json()
    const updateData: {
      title?: string
      description?: string | null
      priority?: Priority
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

    if (body.deadline !== undefined) {
      const deadline = parseOptionalDate(body.deadline)
      if (deadline === 'invalid') return badRequest('Invalid deadline')
      updateData.deadline = deadline ?? null
    }

    if (body.completed !== undefined) {
      if (typeof body.completed !== 'boolean') return badRequest('Invalid completed value')
      updateData.completed = body.completed
    }

    let newPosition: number | null = null
    if (body.position !== undefined) {
      newPosition = parseIndex(body.position)
      if (newPosition === null) return badRequest('Invalid position')
    }

    const owned = await prisma.todoItem.findFirst({
      where: { id, user_id: userId },
      select: { id: true }
    })
    if (!owned) return notFound('Todo')

    if (newPosition !== null) {
      const todos = await prisma.todoItem.findMany({
        where: { user_id: userId },
        orderBy: [{ completed: 'asc' }, { position: 'asc' }, { created_at: 'desc' }],
        select: { id: true }
      })

      const reordered = moveItem(todos, todos.findIndex(t => t.id === id), newPosition)

      await prisma.$transaction(
        reordered.map((todo, index) =>
          prisma.todoItem.update({
            where: { id: todo.id },
            data: { position: index }
          })
        )
      )
    }

    const todo = await prisma.todoItem.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error updating todo:', error)
    return serverError('Failed to update todo')
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Todo')

    const { count } = await prisma.todoItem.deleteMany({
      where: { id, user_id: userId }
    })
    if (count === 0) return notFound('Todo')

    return NextResponse.json({ message: 'Todo deleted successfully' })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return serverError('Failed to delete todo')
  }
}
