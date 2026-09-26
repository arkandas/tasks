import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import { LIMITS, parseId, requiredText } from '@/lib/validate'

type Context = { params: Promise<{ id: string }> }

async function findOwnedTask(id: number, userId: number) {
  return prisma.task.findFirst({
    where: { id, section: { board: { user_id: userId } } },
    select: { id: true }
  })
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const taskId = parseId((await params).id)
    if (!taskId || !(await findOwnedTask(taskId, userId))) return notFound('Task')

    const comments = await prisma.comment.findMany({
      where: { task_id: taskId },
      orderBy: { created_at: 'asc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return serverError('Failed to fetch comments')
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const taskId = parseId((await params).id)
    if (!taskId || !(await findOwnedTask(taskId, userId))) return notFound('Task')

    const body = await request.json()
    const content = requiredText(body.content, LIMITS.comment)
    if (!content) return badRequest('Content is required')

    const comment = await prisma.comment.create({
      data: {
        content,
        task_id: taskId,
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return serverError('Failed to create comment')
  }
}
