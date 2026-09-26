'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import ReactMarkdown from 'react-markdown';
import {
  Board as BoardType,
  Task,
  CreateTask,
  UpdateTask,
  UpdateSection
} from '@/types';
import { SectionColumn } from './SectionColumn';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { boardApi, sectionApi, taskApi } from '@/lib/api';
import { Plus, Edit3, Menu } from 'lucide-react';

interface BoardProps {
  board: BoardType;
  onUpdate: (updatedBoard: BoardType) => void;
  onDelete?: () => void;
  onOpenBoardList?: () => void;
  highlightTaskId?: number | null;
}

const SECTION_SNAP_OFFSET = 12;
const MAX_SECTIONS = 6;
const SECTION_WIDTH =
  'w-[86vw] min-w-[250px] max-w-[330px] sm:w-[220px] sm:min-w-[180px] sm:max-w-none md:w-[230px] lg:w-[240px] xl:w-[250px]';

export function Board({ board: initialBoard, onUpdate, onDelete, onOpenBoardList, highlightTaskId = null }: BoardProps) {
  const [board, setBoard] = useState<BoardType>(initialBoard);
  const [prevInitialBoard, setPrevInitialBoard] = useState(initialBoard);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overSectionId, setOverSectionId] = useState<number | null>(null);
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [editingTitle, setEditingTitle] = useState(initialBoard.title);
  const [editingDescription, setEditingDescription] = useState(initialBoard.description || '');
  const [showDeleteBoardDialog, setShowDeleteBoardDialog] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<{ id: number; title: string; taskCount: number } | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskDialogMode, setTaskDialogMode] = useState<'create' | 'edit' | null>(null);
  const [createTaskSectionId, setCreateTaskSectionId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskSectionId, setTaskSectionId] = useState<number | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const sectionsScrollRef = useRef<HTMLDivElement>(null);
  const sectionTabsRef = useRef<HTMLDivElement>(null);

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

  if (initialBoard !== prevInitialBoard) {
    setPrevInitialBoard(initialBoard);
    setBoard(initialBoard);
    setEditingTitle(initialBoard.title);
    setEditingDescription(initialBoard.description || '');
  }

  const syncActiveSection = useCallback(() => {
    const scroller = sectionsScrollRef.current;
    if (!scroller) return;

    const columns = Array.from(scroller.querySelectorAll<HTMLElement>('[data-section-id]'));
    if (columns.length === 0) {
      setActiveSectionId(null);
      return;
    }

    const snapLine = scroller.getBoundingClientRect().left + SECTION_SNAP_OFFSET;
    let closest = columns[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const column of columns) {
      const distance = Math.abs(column.getBoundingClientRect().left - snapLine);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = column;
      }
    }

    const id = Number(closest.dataset.sectionId);
    setActiveSectionId(prev => (prev === id ? prev : id));
  }, []);

  useEffect(() => {
    const scroller = sectionsScrollRef.current;
    if (!scroller) return;

    let frame = 0;
    const handleScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncActiveSection);
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    syncActiveSection();

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', handleScroll);
    };
  }, [syncActiveSection, board.id, board.sections.length]);

  useEffect(() => {
    const scroller = sectionsScrollRef.current;
    if (!scroller) return;

    scroller.scrollTo({ left: 0 });
    syncActiveSection();
  }, [board.id, syncActiveSection]);

  useEffect(() => {
    if (!highlightTaskId) return;

    const frame = requestAnimationFrame(() => {
      sectionsScrollRef.current
        ?.querySelector<HTMLElement>(`[data-task-id="${highlightTaskId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    });

    return () => cancelAnimationFrame(frame);
  }, [highlightTaskId, board.id]);

  useEffect(() => {
    if (!isAddingSection) return;
    const scroller = sectionsScrollRef.current;
    scroller?.scrollTo({ left: scroller.scrollWidth, behavior: 'smooth' });
  }, [isAddingSection]);

  useEffect(() => {
    if (activeSectionId === null) return;

    const tabs = sectionTabsRef.current;
    const tab = tabs?.querySelector<HTMLElement>(`[data-section-tab="${activeSectionId}"]`);
    if (!tabs || !tab) return;

    const tabsBox = tabs.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();

    if (tabBox.left < tabsBox.left + SECTION_SNAP_OFFSET) {
      tabs.scrollTo({ left: tabs.scrollLeft + (tabBox.left - tabsBox.left) - SECTION_SNAP_OFFSET, behavior: 'smooth' });
    } else if (tabBox.right > tabsBox.right - SECTION_SNAP_OFFSET) {
      tabs.scrollTo({ left: tabs.scrollLeft + (tabBox.right - tabsBox.right) + SECTION_SNAP_OFFSET, behavior: 'smooth' });
    }
  }, [activeSectionId]);

  const scrollToSection = (sectionId: number) => {
    const scroller = sectionsScrollRef.current;
    const column = scroller?.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`);
    if (!scroller || !column) return;

    const delta = column.getBoundingClientRect().left - scroller.getBoundingClientRect().left;
    scroller.scrollTo({ left: scroller.scrollLeft + delta - SECTION_SNAP_OFFSET, behavior: 'smooth' });
    setActiveSectionId(sectionId);
  };

  const handleStartEditingBoard = () => {
    setEditingTitle(board.title);
    setEditingDescription(board.description || '');
    setShowBoardDialog(true);
  };

  const handleSaveBoardEdit = async () => {
    if (editingTitle.trim() === board.title && editingDescription.trim() === (board.description || '')) {
      setShowBoardDialog(false);
      return;
    }

    try {
      const updatedBoardData = await boardApi.update(board.id, {
        title: editingTitle.trim(),
        description: editingDescription.trim() || null,
      });

      const updatedBoard = {
        ...board,
        title: updatedBoardData.title,
        description: updatedBoardData.description,
        updated_at: updatedBoardData.updated_at
      };

      setBoard(updatedBoard);
      setShowBoardDialog(false);
      onUpdate(updatedBoard);
    } catch (error) {
      console.error('Failed to update board:', error);
      setEditingTitle(board.title);
      setEditingDescription(board.description || '');
    }
  };

  const handleCancelBoardEdit = () => {
    setEditingTitle(board.title);
    setEditingDescription(board.description || '');
    setShowBoardDialog(false);
  };

  const handleRequestDeleteBoard = () => {
    setShowBoardDialog(false);
    setShowDeleteBoardDialog(true);
  };

  const handleConfirmDeleteBoard = async () => {
    try {
      await boardApi.delete(board.id);
      setShowDeleteBoardDialog(false);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete board:', error);
    }
  };

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;
    if (board.sections.length >= MAX_SECTIONS) {
      setIsAddingSection(false);
      return;
    }

    try {
      const newSection = await sectionApi.create({
        title: newSectionTitle,
        board_id: board.id,
      });

      const updatedBoard = {
        ...board,
        sections: [...board.sections, { ...newSection, tasks: [] }]
      };

      setBoard(updatedBoard);
      onUpdate(updatedBoard);

      setNewSectionTitle('');
      setIsAddingSection(false);
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  const handleUpdateSection = async (id: number, updates: UpdateSection) => {
    try {
      await sectionApi.update(id, updates);

      const updatedBoard = {
        ...board,
        sections: board.sections.map(section =>
          section.id === id ? { ...section, ...updates } : section
        )
      };

      setBoard(updatedBoard);
      onUpdate(updatedBoard);
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };

  const handleRequestDeleteSection = (id: number) => {
    const section = board.sections?.find(s => s.id === id);
    if (section) {
      setSectionToDelete({
        id: section.id,
        title: section.title,
        taskCount: section.tasks.length
      });
    }
  };

  const handleConfirmDeleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      await sectionApi.delete(sectionToDelete.id);

      const updatedBoard = {
        ...board,
        sections: board.sections.filter(section => section.id !== sectionToDelete.id)
      };

      setBoard(updatedBoard);
      onUpdate(updatedBoard);

      setSectionToDelete(null);
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const handleRequestCreateTask = (sectionId: number) => {
    setCreateTaskSectionId(sectionId);
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('MEDIUM');
    setTaskDeadline('');
    setTaskSectionId(sectionId);
    setTaskDialogMode('create');
  };

  const handleRequestEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskPriority(task.priority || 'MEDIUM');
    setTaskDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
    setTaskSectionId(task.section_id);
    setTaskDialogMode('edit');
  };

  const handleConfirmTaskDialog = async () => {
    if (!taskTitle.trim()) return;

    try {
      if (taskDialogMode === 'create') {
        if (!createTaskSectionId) return;
        await handleCreateTask({
          title: taskTitle,
          description: taskDescription.trim() || undefined,
          priority: taskPriority,
          deadline: taskDeadline || undefined,
          section_id: createTaskSectionId,
        });
      } else if (taskDialogMode === 'edit' && editingTask) {
        const trimmedDescription = taskDescription.trim();
        await handleUpdateTask(
          editingTask.id,
          {
            title: taskTitle,
            description: trimmedDescription === '' ? null : trimmedDescription,
            priority: taskPriority,
            deadline: taskDeadline || null,
          },
          taskSectionId ?? undefined
        );
      }
      handleCancelTaskDialog();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleCancelTaskDialog = () => {
    setTaskDialogMode(null);
    setCreateTaskSectionId(null);
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('MEDIUM');
    setTaskDeadline('');
    setTaskSectionId(null);
  };

  const handleCreateTask = async (task: CreateTask) => {
    const newTask = await taskApi.create(task);

    const updatedBoard = {
      ...board,
      sections: board.sections.map(section =>
        section.id === task.section_id
          ? { ...section, tasks: [...section.tasks, { ...newTask, comments: [] }] }
          : section
      )
    };

    setBoard(updatedBoard);
    onUpdate(updatedBoard);
  };

  const handleUpdateTask = async (id: number, updates: UpdateTask, moveToSectionId?: number) => {
    await taskApi.update(id, updates);

    let updatedBoard = {
      ...board,
      sections: board.sections.map(section => ({
        ...section,
        tasks: section.tasks.map(task =>
          task.id === id ? { ...task, ...updates } : task
        )
      }))
    };

    const fromSection = updatedBoard.sections.find(section => section.tasks.some(task => task.id === id));
    const toSection = moveToSectionId === undefined
      ? undefined
      : updatedBoard.sections.find(section => section.id === moveToSectionId);

    if (fromSection && toSection && fromSection.id !== toSection.id) {
      const movedTask = fromSection.tasks.find(task => task.id === id);
      const newPosition = toSection.tasks.length;

      if (movedTask) {
        updatedBoard = {
          ...updatedBoard,
          sections: updatedBoard.sections.map(section => {
            if (section.id === fromSection.id) {
              return { ...section, tasks: section.tasks.filter(task => task.id !== id) };
            }
            if (section.id === toSection.id) {
              return { ...section, tasks: [...section.tasks, { ...movedTask, section_id: toSection.id }] };
            }
            return section;
          })
        };

        await taskApi.move(id, toSection.id, newPosition);
      }
    }

    setBoard(updatedBoard);
    onUpdate(updatedBoard);
  };

  const handleRequestDeleteTask = (id: number) => {
    const task = board.sections.flatMap(section => section.tasks).find(t => t.id === id);
    if (task) setTaskToDelete(task);
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const id = taskToDelete.id;

    try {
      await taskApi.delete(id);

      const updatedBoard = {
        ...board,
        sections: board.sections.map(section => ({
          ...section,
          tasks: section.tasks.filter(task => task.id !== id)
        }))
      };

      setBoard(updatedBoard);
      onUpdate(updatedBoard);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current?.type === 'task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (!over) {
      setOverSectionId(null);
      return;
    }

    const overData = over.data.current;

    if (overData?.type === 'section') {
      setOverSectionId(overData.section.id);
    } else if (overData?.type === 'task') {
      setOverSectionId(overData.task.section_id);
    } else if (typeof over.id === 'string' && over.id.startsWith('section-')) {
      setOverSectionId(parseInt(over.id.replace('section-', '')));
    } else {
      setOverSectionId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
    setOverSectionId(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'task') return;

    const movedTask = activeData.task as Task;
    let targetSectionId: number;

    if (overData?.type === 'section') {
      targetSectionId = overData.section.id;
    } else if (overData?.type === 'task') {
      targetSectionId = overData.task.section_id;
    } else if (typeof over.id === 'string' && over.id.startsWith('section-')) {
      targetSectionId = parseInt(over.id.replace('section-', ''));
    } else {
      return;
    }

    const targetSection = board.sections.find(s => s.id === targetSectionId);
    if (!targetSection) return;

    const overIndex = overData?.type === 'task'
      ? targetSection.tasks.findIndex(t => t.id === overData.task.id)
      : -1;

    let newPosition: number;
    let sections = board.sections;

    if (movedTask.section_id === targetSectionId) {
      const oldIndex = targetSection.tasks.findIndex(t => t.id === movedTask.id);
      newPosition = overIndex === -1 ? targetSection.tasks.length - 1 : overIndex;
      if (oldIndex === -1 || oldIndex === newPosition) return;

      sections = sections.map(section =>
        section.id === targetSectionId
          ? { ...section, tasks: arrayMove(section.tasks, oldIndex, newPosition) }
          : section
      );
    } else {
      newPosition = overIndex === -1 ? targetSection.tasks.length : overIndex;

      sections = sections.map(section => {
        if (section.id === movedTask.section_id) {
          return { ...section, tasks: section.tasks.filter(t => t.id !== movedTask.id) };
        }
        if (section.id === targetSectionId) {
          const tasks = [...section.tasks];
          tasks.splice(newPosition, 0, { ...movedTask, section_id: targetSectionId });
          return { ...section, tasks };
        }
        return section;
      });
    }

    const updatedBoard = { ...board, sections };
    setBoard(updatedBoard);
    onUpdate(updatedBoard);

    try {
      await taskApi.move(movedTask.id, targetSectionId, newPosition);
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const boardTaskCount = board.sections.reduce((count, section) => count + section.tasks.length, 0);

  return (
    <>
      <Dialog open={showBoardDialog} onClose={handleCancelBoardEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
            <DialogClose onClick={handleCancelBoardEdit} />
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveBoardEdit();
          }}>
            <div className="space-y-4">
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Board title..."
                aria-label="Board title"
              />

              <Textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                placeholder="Description..."
                aria-label="Board description"
                rows={2}
              />

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row-reverse sm:justify-between sm:gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRequestDeleteBoard}
                  className="w-full sm:w-auto"
                >
                  Delete Board
                </Button>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 sm:flex-none">Save</Button>
                  <Button type="button" variant="outline" onClick={handleCancelBoardEdit} className="flex-1 sm:flex-none">Cancel</Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteBoardDialog}
        title="Delete Board"
        confirmLabel="Delete Board"
        onConfirm={handleConfirmDeleteBoard}
        onCancel={() => setShowDeleteBoardDialog(false)}
      >
        Are you sure you want to delete the board <strong className="text-ink">&quot;{board.title}&quot;</strong>?
        {board.sections.length > 0 && (
          <span className="mt-2 block font-medium text-danger">
            This will also delete {board.sections.length} section{board.sections.length !== 1 ? 's' : ''}
            {boardTaskCount > 0 && ` and ${boardTaskCount} task${boardTaskCount !== 1 ? 's' : ''}`}.
          </span>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={sectionToDelete !== null}
        title="Delete Section"
        onConfirm={handleConfirmDeleteSection}
        onCancel={() => setSectionToDelete(null)}
      >
        Are you sure you want to delete the section <strong className="text-ink">&quot;{sectionToDelete?.title}&quot;</strong>?
        {sectionToDelete && sectionToDelete.taskCount > 0 && (
          <span className="mt-2 block font-medium text-danger">
            This will also delete {sectionToDelete.taskCount} task{sectionToDelete.taskCount !== 1 ? 's' : ''} in this section.
          </span>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={taskToDelete !== null}
        title="Delete Task"
        onConfirm={handleConfirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      >
        Are you sure you want to delete the task <strong className="text-ink">&quot;{taskToDelete?.title}&quot;</strong>?
      </ConfirmDialog>

      <Dialog open={taskDialogMode !== null} onClose={handleCancelTaskDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{taskDialogMode === 'create' ? 'Create New Task' : 'Edit Task'}</DialogTitle>
            <DialogClose onClick={handleCancelTaskDialog} />
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleConfirmTaskDialog();
          }}>
            <div className="space-y-4">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title..."
                aria-label="Task title"
                maxLength={100}
                autoFocus
                required
              />
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Task description (optional, markdown supported)..."
                aria-label="Task description"
                rows={6}
                maxLength={1000}
                className="h-28 sm:h-auto"
              />
              {taskDialogMode === 'edit' && board.sections.length > 1 && (
                <div className="sm:hidden">
                  <label htmlFor="task-section" className="mb-1.5 block text-sm font-medium text-ink-muted">Section</label>
                  <Select
                    id="task-section"
                    value={taskSectionId ?? ''}
                    onChange={(e) => setTaskSectionId(Number(e.target.value))}
                  >
                    {board.sections.map((section) => (
                      <option key={section.id} value={section.id}>{section.title}</option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="task-priority" className="mb-1.5 block text-sm font-medium text-ink-muted">Priority</label>
                  <Select
                    id="task-priority"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </Select>
                </div>
                <div>
                  <label htmlFor="task-deadline" className="mb-1.5 block text-sm font-medium text-ink-muted">Deadline</label>
                  <Input
                    id="task-deadline"
                    type="date"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className={taskDeadline ? undefined : 'text-ink-faint'}
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelTaskDialog}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {taskDialogMode === 'create' ? 'Create Task' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveTask(null);
          setOverSectionId(null);
        }}
      >
        <div className="flex h-full flex-col bg-canvas">
          <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line bg-surface px-2 sm:gap-3 sm:px-4">
            {onOpenBoardList && (
              <button
                type="button"
                onClick={onOpenBoardList}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-canvas md:hidden"
                aria-label="Show boards"
              >
                <Menu size={20} />
              </button>
            )}

            <h1 className="min-w-0 shrink-0 truncate text-base font-bold text-ink max-sm:flex-1 sm:max-w-[45%] sm:text-lg">{board.title}</h1>

            {board.description ? (
              <div className="markdown-content hidden min-w-0 flex-1 text-sm text-ink-muted sm:block [&_*]:m-0 [&_*]:truncate">
                <ReactMarkdown>{board.description}</ReactMarkdown>
              </div>
            ) : (
              <span className="hidden flex-1 sm:block" />
            )}

            <button
              type="button"
              onClick={handleStartEditingBoard}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas hover:text-ink max-sm:w-10 max-sm:px-0"
              title="Edit board"
              aria-label="Edit board"
            >
              <Edit3 size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>

          {board.sections.length > 0 && (
            <div
              ref={sectionTabsRef}
              className="no-scrollbar flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-line bg-surface px-3 py-1.5 sm:hidden"
            >
              {board.sections.map((section) => {
                const isActive = activeSectionId === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    data-section-tab={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-ink'
                        : 'bg-canvas text-ink-muted active:bg-muted'
                    }`}
                  >
                    <span className="max-w-[7.5rem] truncate">{section.title}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                      isActive ? 'bg-accent-ink/20 text-accent-ink' : 'bg-surface text-ink-muted'
                    }`}>
                      {section.tasks.length}
                    </span>
                  </button>
                );
              })}
              {board.sections.length < MAX_SECTIONS && (
                <button
                  type="button"
                  onClick={() => setIsAddingSection(true)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-muted transition-colors active:bg-muted"
                  aria-label="Add section"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          )}

          <div
            ref={sectionsScrollRef}
            className={`sections-scroll themed-scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-3 py-3 sm:overflow-y-auto sm:px-4 sm:pb-6 md:px-5 ${activeTask ? 'is-dragging' : ''}`}
          >
            <div className="flex h-full min-w-full items-stretch gap-3 sm:h-auto sm:items-start">
              <div className="hidden flex-1 sm:block"></div>
              <div className="flex h-full items-stretch gap-3 pr-3 sm:h-auto sm:items-start sm:pr-0">
                {board.sections?.map((section) => (
                  <SectionColumn
                    key={section.id}
                    section={section}
                    widthClass={SECTION_WIDTH}
                    onDeleteTask={handleRequestDeleteTask}
                    onUpdateSection={handleUpdateSection}
                    onDeleteSection={handleRequestDeleteSection}
                    onRequestCreateTask={handleRequestCreateTask}
                    onRequestEditTask={handleRequestEditTask}
                    isBeingDraggedOver={overSectionId === section.id}
                    highlightTaskId={highlightTaskId}
                  />
                ))}

                {board.sections.length < MAX_SECTIONS && (isAddingSection ? (
                  <div className={`section-col shrink-0 self-start rounded-xl border border-line bg-surface p-3 shadow-xs ${SECTION_WIDTH}`}>
                    <Input
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="Enter section title..."
                      aria-label="Section title"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSection();
                        if (e.key === 'Escape') {
                          setIsAddingSection(false);
                          setNewSectionTitle('');
                        }
                      }}
                      autoFocus
                    />
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={handleCreateSection}>
                        Add Section
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingSection(false);
                          setNewSectionTitle('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingSection(true)}
                    className={`section-col flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-xl border-2 border-dashed border-line-strong text-sm font-medium text-ink-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent ${SECTION_WIDTH}`}
                  >
                    <Plus size={18} />
                    Add Section
                  </button>
                ))}
              </div>
              <div className="flex-1"></div>
            </div>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-2 cursor-grabbing">
              <TaskCard
                task={activeTask}
                onRequestEdit={handleRequestEditTask}
                onDelete={handleRequestDeleteTask}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
