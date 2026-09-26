import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, notFound, badRequest, serverError } from '@/lib/api-auth'
import { parseId, parseIndex } from '@/lib/validate'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const id = parseId((await params).id)
    if (!id) return notFound('Task')

    const { searchParams } = new URL(request.url)
    const newSectionId = parseId(searchParams.get('new_section_id'))
    const newPosition = parseIndex(searchParams.get('new_position'))

    if (!newSectionId || newPosition === null) {
      return badRequest('Invalid section or position')
    }

    const owned = { board: { user_id: userId } }

    const [task, targetSection] = await Promise.all([
      prisma.task.findFirst({
        where: { id, section: owned },
        select: { id: true, section_id: true }
      }),
      prisma.section.findFirst({
        where: { id: newSectionId, ...owned },
        select: { id: true }
      }),
    ])

    if (!task) return notFound('Task')
    if (!targetSection) return notFound('Section')

    const order = [{ position: 'asc' as const }, { id: 'asc' as const }]

    const targetIds = (await prisma.task.findMany({
      where: { section_id: newSectionId, id: { not: id } },
      orderBy: order,
      select: { id: true }
    })).map(t => t.id)

    targetIds.splice(Math.min(newPosition, targetIds.length), 0, id)

    const sourceIds = task.section_id === newSectionId
      ? []
      : (await prisma.task.findMany({
          where: { section_id: task.section_id, id: { not: id } },
          orderBy: order,
          select: { id: true }
        })).map(t => t.id)

    await prisma.$transaction([
      ...targetIds.map((taskId, index) =>
        prisma.task.update({
          where: { id: taskId },
          data: taskId === id
            ? { position: index, section_id: newSectionId }
            : { position: index }
        })
      ),
      ...sourceIds.map((taskId, index) =>
        prisma.task.update({
          where: { id: taskId },
          data: { position: index }
        })
      ),
    ])

    const moved = await prisma.task.findUnique({ where: { id } })
    return NextResponse.json(moved)
  } catch (error) {
    console.error('Error moving task:', error)
    return serverError('Failed to move task')
  }
}
