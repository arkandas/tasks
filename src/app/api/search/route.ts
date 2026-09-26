import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, unauthorized, serverError } from '@/lib/api-auth'
import { escapeLikePattern } from '@/lib/search-text'

const MAX_QUERY_LENGTH = 100
const MAX_RESULTS = 25

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) return unauthorized()

    const query = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH)
    if (!query) {
      return NextResponse.json({ tasks: [], todos: [], stickyNotes: [] })
    }

    const matches = { contains: escapeLikePattern(query), mode: 'insensitive' as const }

    const [tasks, todos, stickyNotes] = await Promise.all([
      prisma.task.findMany({
        where: {
          section: { board: { user_id: userId } },
          OR: [{ title: matches }, { description: matches }],
        },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          section: {
            select: {
              id: true,
              title: true,
              board: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { updated_at: 'desc' },
        take: MAX_RESULTS,
      }),
      prisma.todoItem.findMany({
        where: {
          user_id: userId,
          OR: [{ title: matches }, { description: matches }],
        },
        select: { id: true, title: true, description: true, completed: true },
        orderBy: [{ completed: 'asc' }, { updated_at: 'desc' }],
        take: MAX_RESULTS,
      }),
      prisma.stickyNote.findMany({
        where: { user_id: userId, deleted_at: null, content: matches },
        select: { id: true, content: true, color: true },
        orderBy: { updated_at: 'desc' },
        take: MAX_RESULTS,
      }),
    ])

    return NextResponse.json({
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        section_id: task.section.id,
        section_title: task.section.title,
        board_id: task.section.board.id,
        board_title: task.section.board.title,
      })),
      todos,
      stickyNotes,
    })
  } catch (error) {
    console.error('Error searching:', error)
    return serverError('Failed to search')
  }
}
