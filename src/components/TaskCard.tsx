'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Task } from '@/types';
import { formatDeadline, isOverdue } from '@/lib/deadline';
import { Calendar, Clock, Edit2, GripVertical, Trash2, MessageSquare } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onDelete: (id: number) => void;
  onRequestEdit: (task: Task) => void;
  isOverlay?: boolean;
  isHighlighted?: boolean;
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export function TaskCard({ task, onDelete, onRequestEdit, isOverlay = false, isHighlighted = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = !!task.deadline && !task.completed && isOverdue(task.deadline);

  const lowered = task.priority?.toLowerCase();
  const priority = PRIORITIES.find(p => p === lowered) ?? 'medium';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-task-id={isOverlay ? undefined : task.id}
      className={`touch-draggable priority-${priority} priority-card cursor-grab overflow-hidden rounded-lg border p-3 transition-shadow duration-200 active:cursor-grabbing ${
        isOverlay ? 'shadow-xl ring-1 ring-accent/40' : 'shadow-xs hover:shadow-md'
      } ${task.completed ? 'opacity-70' : ''} ${isHighlighted ? 'search-hit' : ''}`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-1">
          <GripVertical
            size={16}
            aria-hidden="true"
            className="-ml-1 mt-0.5 shrink-0 text-ink-faint sm:hidden"
          />
          <h3 className={`min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-ink ${
            task.completed ? 'line-through' : ''
          }`}>
            {task.title}
          </h3>
          <div className="-mr-1.5 -mt-1.5 flex shrink-0 items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestEdit(task);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-raised hover:text-accent sm:h-7 sm:w-7"
              title="Edit task"
              aria-label="Edit task"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger sm:h-7 sm:w-7"
              title="Delete task"
              aria-label="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {task.description && (
          <div className="markdown-content text-[13px] leading-relaxed text-ink-muted">
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
              {task.description}
            </ReactMarkdown>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-0.5">
          <span className="priority-chip rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize leading-4">
            {priority}
          </span>

          {task.deadline && (
            <span
              className={`flex items-center gap-1 text-xs font-medium ${
                overdue
                  ? 'rounded-md border border-danger/40 bg-danger-soft px-1.5 py-0.5 text-danger'
                  : 'text-ink-muted'
              }`}
            >
              <Calendar size={12} />
              {formatDeadline(task.deadline)}
              {overdue && <Clock size={12} />}
            </span>
          )}

          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-ink-muted">
              <MessageSquare size={12} />
              {task.comments.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
