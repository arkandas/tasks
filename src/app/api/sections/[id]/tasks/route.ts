import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, serverError } from '@/lib/api-auth'
import { parseId } from '@/lib/validate'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const sectionId = parseId((await params).id)
    if (!sectionId) return notFound('Section')

    const section = await prisma.section.findFirst({
      where: { id: sectionId, board: { user_id: userId } },
      select: { id: true }
    })
    if (!section) return notFound('Section')

    const tasks = await prisma.task.findMany({
      where: { section_id: sectionId },
      include: { comments: true },
      orderBy: [{ position: 'asc' }, { id: 'asc' }]
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return serverError('Failed to fetch tasks')
  }
}
