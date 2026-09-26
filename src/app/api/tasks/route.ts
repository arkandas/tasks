import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import {
  LIMITS,
  parseId,
  requiredText,
  optionalText,
  isValidOptionalText,
  isPriority,
  parseOptionalDate,
} from '@/lib/validate'

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

    const sectionId = parseId(body.section_id)
    if (!sectionId) return notFound('Section')

    const section = await prisma.section.findFirst({
      where: { id: sectionId, board: { user_id: userId } },
      select: { id: true }
    })
    if (!section) return notFound('Section')

    const last = await prisma.task.findFirst({
      where: { section_id: sectionId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const task = await prisma.task.create({
      data: {
        title,
        description: optionalText(body.description, LIMITS.description) ?? null,
        priority: body.priority ?? 'MEDIUM',
        position: (last?.position ?? -1) + 1,
        deadline: deadline ?? null,
        section_id: sectionId,
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return serverError('Failed to create task')
  }
}
