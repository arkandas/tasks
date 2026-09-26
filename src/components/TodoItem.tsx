'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TodoItem as TodoItemType } from '@/types';
import { Calendar, Clock, Edit2, Trash2, Check } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDeadline, isOverdue } from '@/lib/deadline';

interface TodoItemProps {
  todo: TodoItemType;
  onDelete: (id: number) => Promise<void>;
  onRequestEdit: (todo: TodoItemType) => void;
  onToggleComplete: (id: number, completed: boolean) => Promise<void>;
  isOverlay?: boolean;
  isHighlighted?: boolean;
}

export function TodoItem({ todo, onDelete, onRequestEdit, onToggleComplete, isOverlay = false, isHighlighted = false }: TodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: {
      type: 'todo',
      todo,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = !!todo.deadline && !todo.completed && isOverdue(todo.deadline);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-todo-id={isOverlay ? undefined : todo.id}
      className={`touch-draggable cursor-grab overflow-hidden rounded-xl border border-line p-3 transition-shadow duration-200 active:cursor-grabbing sm:px-4 ${
        todo.completed ? 'bg-surface' : 'bg-card'
      } ${isOverlay ? 'shadow-xl ring-1 ring-accent/40' : 'shadow-xs hover:shadow-md'} ${isHighlighted ? 'search-hit' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(todo.id, !todo.completed);
          }}
          className={`mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-200 sm:h-6 sm:w-6 ${
            todo.completed
              ? 'border-accent bg-accent text-accent-ink'
              : 'border-line-strong hover:border-accent hover:bg-accent-soft'
          }`}
          title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
          aria-pressed={todo.completed}
        >
          {todo.completed && <Check size={15} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`min-w-0 flex-1 break-words pt-0.5 text-[15px] font-semibold leading-snug ${
              todo.completed ? 'text-ink-faint line-through' : 'text-ink'
            }`}>
              {todo.title}
            </h3>
            <div className="-mr-1.5 -mt-1 flex shrink-0 items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestEdit(todo);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-accent-soft hover:text-accent sm:h-8 sm:w-8"
                title="Edit item"
                aria-label="Edit item"
              >
                <Edit2 size={15} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(todo.id);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger sm:h-8 sm:w-8"
                title="Delete item"
                aria-label="Delete item"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {todo.description && (
            <div className={`markdown-content mt-1 text-sm leading-relaxed ${
              todo.completed ? 'text-ink-faint line-through' : 'text-ink-muted'
            }`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ),
                }}
              >
                {todo.description}
              </ReactMarkdown>
            </div>
          )}

          {todo.deadline && (
            <div className="mt-2.5 flex">
              <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                overdue
                  ? 'border-danger/40 bg-danger-soft text-danger'
                  : 'border-line bg-canvas text-ink-muted'
              }`}>
                {overdue ? <Clock size={12} /> : <Calendar size={12} />}
                {formatDeadline(todo.deadline)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
