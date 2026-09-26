'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Section, Task, UpdateSection } from '@/types';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface SectionColumnProps {
  section: Section;
  widthClass: string;
  onDeleteTask: (id: number) => void;
  onUpdateSection: (id: number, updates: UpdateSection) => Promise<void>;
  onDeleteSection: (id: number) => void;
  onRequestCreateTask: (sectionId: number) => void;
  onRequestEditTask: (task: Task) => void;
  isBeingDraggedOver?: boolean;
  highlightTaskId?: number | null;
}

export function SectionColumn({
  section,
  widthClass,
  onDeleteTask,
  onUpdateSection,
  onDeleteSection,
  onRequestCreateTask,
  onRequestEditTask,
  isBeingDraggedOver = false,
  highlightTaskId = null,
}: SectionColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [sectionTitle, setSectionTitle] = useState(section.title);

  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: {
      type: 'section',
      section,
    },
  });

  const handleUpdateSectionTitle = async () => {
    const trimmed = sectionTitle.trim();
    if (!trimmed || trimmed === section.title) {
      setSectionTitle(section.title);
      setIsEditingTitle(false);
      return;
    }

    try {
      await onUpdateSection(section.id, { title: trimmed });
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Failed to update section:', error);
      setSectionTitle(section.title);
    }
  };

  const handleCancelEdit = () => {
    setSectionTitle(section.title);
    setIsEditingTitle(false);
  };

  const taskIds = section.tasks.map((task) => task.id);
  const isDropTarget = isBeingDraggedOver || isOver;

  return (
    <div
      ref={setNodeRef}
      data-section-id={section.id}
      className={`section-col flex h-full shrink-0 flex-col rounded-xl border transition-colors duration-200 sm:h-auto ${widthClass} ${
        isDropTarget
          ? 'border-accent bg-accent-soft ring-2 ring-accent/25'
          : 'border-line bg-surface'
      }`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line py-1.5 pl-3 pr-1.5">
        {isEditingTitle ? (
          <div className="flex flex-1 items-center gap-2 py-0.5">
            <Input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateSectionTitle();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              aria-label="Section title"
              className="h-9 px-2.5 sm:h-8"
              autoFocus
            />
            <Button size="sm" onClick={handleUpdateSectionTitle}>
              Save
            </Button>
          </div>
        ) : (
          <>
            <h2 className="flex min-w-0 flex-1 items-baseline gap-2">
              <button
                type="button"
                className="min-w-0 truncate text-sm font-semibold text-ink transition-colors hover:text-accent"
                onClick={() => setIsEditingTitle(true)}
                title={`${section.title} (click to rename)`}
              >
                {section.title}
              </button>
              <span className="shrink-0 text-xs font-medium tabular-nums text-ink-faint">{section.tasks.length}</span>
            </h2>
            <button
              onClick={() => onDeleteSection(section.id)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger sm:h-8 sm:w-8"
              title="Delete section"
              aria-label="Delete section"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col sm:min-h-[180px]">
        <div className="themed-scroll min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-2.5 pb-1 pt-2.5 sm:overflow-visible">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {section.tasks.map((task: Task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={onDeleteTask}
                onRequestEdit={onRequestEditTask}
                isHighlighted={highlightTaskId === task.id}
              />
            ))}
          </SortableContext>

          {section.tasks.length === 0 && (
            <div
              className={`flex min-h-[110px] items-center justify-center rounded-lg border-2 border-dashed text-sm font-medium transition-colors duration-200 ${
                isDropTarget
                  ? 'border-accent text-accent'
                  : 'border-line-strong text-ink-faint'
              }`}
            >
              Drop tasks here
            </div>
          )}
        </div>

        <div className="shrink-0 px-2.5 pb-2.5 pt-1.5">
          <button
            type="button"
            onClick={() => onRequestCreateTask(section.id)}
            className="flex h-11 w-full items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-muted hover:text-ink sm:h-9"
          >
            <Plus size={16} />
            Add task
          </button>
        </div>
      </div>
    </div>
  );
}
