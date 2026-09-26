import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import { LIMITS, parseId, requiredText } from '@/lib/validate'

type Context = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Comment')

    const body = await request.json()
    const content = requiredText(body.content, LIMITS.comment)
    if (!content) return badRequest('Content is required')

    const owned = await prisma.comment.findFirst({
      where: { id, task: { section: { board: { user_id: userId } } } },
      select: { id: true }
    })
    if (!owned) return notFound('Comment')

    const comment = await prisma.comment.update({
      where: { id },
      data: { content }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return serverError('Failed to update comment')
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Comment')

    const { count } = await prisma.comment.deleteMany({
      where: { id, task: { section: { board: { user_id: userId } } } }
    })
    if (count === 0) return notFound('Comment')

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return serverError('Failed to delete comment')
  }
}
