'use client';

import React, { useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Board, SearchHit, SearchResults } from '@/types';
import { searchApi } from '@/lib/api';
import { firstLine, snippet } from '@/lib/search-text';
import { Folder, Plus, Search, X } from 'lucide-react';

interface BoardSidebarProps {
  boards: Board[];
  selectedBoardId?: number;
  onReorder: (event: DragEndEvent) => void;
  onSelect: (boardId: number) => void;
  onCreate: () => void;
  onOpenHit: (hit: SearchHit) => void;
}

function SortableBoardRow({
  board,
  isSelected,
  onSelect,
}: {
  board: Board;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-draggable">
      <button
        onClick={onSelect}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors md:py-2 ${
          isSelected
            ? 'bg-accent text-accent-ink shadow-xs'
            : 'text-ink hover:bg-muted'
        }`}
        title="Drag to reorder boards"
      >
        <Folder
          size={15}
          className={`shrink-0 ${isSelected ? 'text-accent-ink' : 'text-ink-muted'}`}
        />
        <span className="truncate">{board.title}</span>
      </button>
    </div>
  );
}

const groupLabel = 'px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint';
const resultRow = 'block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted';

export function BoardSidebar({
  boards,
  selectedBoardId,
  onReorder,
  onSelect,
  onCreate,
  onOpenHit,
}: BoardSidebarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ query: string; data: SearchResults } | null>(null);
  const trimmedQuery = query.trim();

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  useEffect(() => {
    if (!trimmedQuery) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchApi.search(trimmedQuery, controller.signal);
        setResults({ query: trimmedQuery, data });
      } catch (error) {
        if (!controller.signal.aborted) console.error('Failed to search:', error);
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery]);

  const current = results && results.query === trimmedQuery ? results.data : null;
  const total = current ? current.tasks.length + current.todos.length + current.stickyNotes.length : 0;

  return (
    <>
      <div className="flex h-12 shrink-0 items-center border-b border-line px-2">
        <div className="relative w-full">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setQuery('');
            }}
            placeholder="Search…"
            aria-label="Search tasks, to-dos and sticky notes"
            className="h-9 w-full rounded-lg border border-line bg-raised pl-9 pr-8 text-base text-ink outline-hidden transition-colors placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/25 md:h-8 md:text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-sm text-ink-faint hover:text-ink-muted"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="themed-scroll flex-1 overflow-y-auto overscroll-contain p-2">
        {trimmedQuery ? (
          <div aria-live="polite">
            {!current && (
              <p className="px-1 py-6 text-center text-xs text-ink-muted">Searching…</p>
            )}

            {current && total === 0 && (
              <p className="px-1 py-6 text-center text-xs text-ink-muted">No results for “{trimmedQuery}”</p>
            )}

            {current && current.tasks.length > 0 && (
              <>
                <div className={`${groupLabel} pt-1`}>Tasks</div>
                {current.tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => onOpenHit({ type: 'task', id: task.id, boardId: task.board_id })}
                    className={resultRow}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`priority-${task.priority.toLowerCase()} h-1.5 w-1.5 shrink-0 rounded-full`}
                        style={{ backgroundColor: 'var(--chip)' }}
                      />
                      <span className="truncate text-sm font-medium text-ink">{task.title}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-muted">
                      {task.board_title} › {task.section_title}
                    </span>
                    {snippet(task.description, trimmedQuery) && (
                      <span className="mt-0.5 block truncate text-xs text-ink-faint">
                        {snippet(task.description, trimmedQuery)}
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}

            {current && current.todos.length > 0 && (
              <>
                <div className={groupLabel}>To-Do</div>
                {current.todos.map(todo => (
                  <button
                    key={todo.id}
                    onClick={() => onOpenHit({ type: 'todo', id: todo.id })}
                    className={resultRow}
                  >
                    <span className={`block truncate text-sm font-medium ${todo.completed ? 'text-ink-faint line-through' : 'text-ink'}`}>
                      {todo.title}
                    </span>
                    {snippet(todo.description, trimmedQuery) && (
                      <span className="mt-0.5 block truncate text-xs text-ink-faint">
                        {snippet(todo.description, trimmedQuery)}
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}

            {current && current.stickyNotes.length > 0 && (
              <>
                <div className={groupLabel}>Sticky Notes</div>
                {current.stickyNotes.map(note => (
                  <button
                    key={note.id}
                    onClick={() => onOpenHit({ type: 'stickyNote', id: note.id })}
                    className={resultRow}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`sticky-${note.color} h-3 w-3 shrink-0 rounded-[3px] border`}
                        style={{ backgroundColor: 'var(--sticky)', borderColor: 'var(--sticky-edge)' }}
                      />
                      <span className="truncate text-sm font-medium text-ink">
                        {snippet(note.content, trimmedQuery) ?? firstLine(note.content)}
                      </span>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onReorder}
            >
              <SortableContext
                items={boards.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-0.5">
                  {boards.map((board) => (
                    <SortableBoardRow
                      key={board.id}
                      board={board}
                      isSelected={selectedBoardId === board.id}
                      onSelect={() => onSelect(board.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {boards.length === 0 && (
              <p className="px-1 py-6 text-center text-xs text-ink-muted">No boards yet</p>
            )}
            <button
              type="button"
              onClick={onCreate}
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-muted hover:text-ink md:py-2"
            >
              <Plus size={15} className="shrink-0" />
              New board
            </button>
          </>
        )}
      </div>
    </>
  );
}
