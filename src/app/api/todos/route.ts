import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, badRequest, serverError } from '@/lib/api-auth'
import {
  LIMITS,
  requiredText,
  optionalText,
  isValidOptionalText,
  isPriority,
  parseOptionalDate,
} from '@/lib/validate'

export async function GET() {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const todos = await prisma.todoItem.findMany({
      where: { user_id: userId },
      orderBy: [
        { completed: 'asc' },
        { position: 'asc' },
        { created_at: 'desc' }
      ]
    })
    return NextResponse.json(todos)
  } catch (error) {
    console.error('Error fetching todos:', error)
    return serverError('Failed to fetch todos')
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
    if (body.priority !== undefined && !isPriority(body.priority)) {
      return badRequest('Invalid priority')
    }

    const deadline = parseOptionalDate(body.deadline)
    if (deadline === 'invalid') return badRequest('Invalid deadline')

    const firstTodo = await prisma.todoItem.findFirst({
      where: { user_id: userId },
      orderBy: { position: 'asc' },
      select: { position: true }
    })

    const todo = await prisma.todoItem.create({
      data: {
        title,
        description: optionalText(body.description, LIMITS.description) ?? null,
        priority: body.priority ?? 'MEDIUM',
        deadline: deadline ?? null,
        position: (firstTodo?.position ?? 1) - 1,
        user_id: userId,
      }
    })

    return NextResponse.json(todo, { status: 201 })
  } catch (error) {
    console.error('Error creating todo:', error)
    return serverError('Failed to create todo')
  }
}
