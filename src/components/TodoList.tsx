'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TodoItem as TodoItemType, CreateTodoItem, UpdateTodoItem } from '@/types';
import { TodoItem } from '@/components/TodoItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { todoApi } from '@/lib/api';
import { Plus, ListTodo, Trash2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

const byListOrder = (a: TodoItemType, b: TodoItemType) =>
  Number(a.completed) - Number(b.completed) ||
  a.position - b.position ||
  b.created_at.localeCompare(a.created_at);

export function TodoList({ highlightId = null }: { highlightId?: number | null }) {
  const [todos, setTodos] = useState<TodoItemType[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItemType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTodo, setActiveTodo] = useState<TodoItemType | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
  });

  const orderedTodos = [...todos].sort(byListOrder);
  const activeTodos = orderedTodos.filter(t => !t.completed);
  const completedTodos = orderedTodos.filter(t => t.completed);

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
    todoApi.getAll()
      .then(setTodos)
      .catch(error => console.error('Failed to load todos:', error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!highlightId) return;

    const frame = requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>(`[data-todo-id="${highlightId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    return () => cancelAnimationFrame(frame);
  }, [highlightId, todos.length]);

  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    try {
      const newTodo: CreateTodoItem = {
        title: formData.title,
        description: formData.description || undefined,
        deadline: formData.deadline || undefined,
      };

      const created = await todoApi.create(newTodo);
      setTodos(prev => [created, ...prev]);
      resetForm();
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingTodo || !formData.title.trim()) return;

    try {
      const trimmedDescription = formData.description.trim();
      const updates: UpdateTodoItem = {
        title: formData.title,
        description: trimmedDescription === '' ? null : trimmedDescription,
        deadline: formData.deadline || null,
      };

      const updated = await todoApi.update(editingTodo.id, updates);
      setTodos(prev => prev.map(t => t.id === updated.id ? updated : t));
      resetForm();
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await todoApi.delete(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const handleClearCompleted = async () => {
    const completedIds = todos.filter(t => t.completed).map(t => t.id);
    const results = await Promise.allSettled(completedIds.map(id => todoApi.delete(id)));
    const deletedIds = new Set(completedIds.filter((_, index) => results[index].status === 'fulfilled'));
    setTodos(prev => prev.filter(t => !deletedIds.has(t.id)));

    const failure = results.find(result => result.status === 'rejected');
    if (failure) console.error('Failed to clear completed todos:', failure.reason);
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      const updated = await todoApi.update(id, {
        completed
      });
      setTodos(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleRequestEdit = (todo: TodoItemType) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description || '',
      deadline: todo.deadline ? todo.deadline.split('T')[0] : '',
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      deadline: '',
    });
    setIsCreating(false);
    setEditingTodo(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const todo = todos.find(t => t.id === active.id);
    if (todo) {
      setActiveTodo(todo);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTodo(null);

    if (!over || active.id === over.id) return;

    const oldIndex = orderedTodos.findIndex(t => t.id === active.id);
    const newIndex = orderedTodos.findIndex(t => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedTodos = arrayMove(orderedTodos, oldIndex, newIndex).map((todo, position) => ({ ...todo, position }));
    setTodos(reorderedTodos);

    try {
      await todoApi.update(active.id as number, {
        position: newIndex
      });
    } catch (error) {
      console.error('Failed to update todo position:', error);
      setTodos(todos);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTodo(null)}
    >
      <div ref={listRef} className="themed-scroll h-full overflow-y-auto overscroll-contain bg-canvas px-4 py-5 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">To-Do</h2>
            <Button
              onClick={() => setIsCreating(true)}
              className="h-11 shrink-0 text-base sm:h-10 sm:text-sm"
            >
              <Plus size={16} className="mr-2" />
              New item
            </Button>
          </div>

          {activeTodos.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                <ListTodo size={14} />
                Active
                <span className="tabular-nums">{activeTodos.length}</span>
              </h3>
              <SortableContext items={activeTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {activeTodos.map(todo => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onDelete={handleDelete}
                    onRequestEdit={handleRequestEdit}
                    onToggleComplete={handleToggleComplete}
                    isHighlighted={highlightId === todo.id}
                  />
                ))}
              </SortableContext>
            </div>
          )}

          {completedTodos.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  <ListTodo size={14} />
                  Completed
                  <span className="tabular-nums">{completedTodos.length}</span>
                </h3>
                <button
                  onClick={handleClearCompleted}
                  className="-my-2 flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
                  title="Clear completed"
                  aria-label="Clear completed"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              </div>
              <SortableContext items={completedTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {completedTodos.map(todo => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onDelete={handleDelete}
                    onRequestEdit={handleRequestEdit}
                    onToggleComplete={handleToggleComplete}
                    isHighlighted={highlightId === todo.id}
                  />
                ))}
              </SortableContext>
            </div>
          )}

          {todos.length === 0 && !loading && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <ListTodo size={64} className="mx-auto mb-4 text-ink-faint" />
                <h3 className="mb-2 text-xl font-semibold text-ink">No items yet</h3>
                <p className="mb-5 text-ink-muted">Add your first item to get started</p>
                <Button onClick={() => setIsCreating(true)} className="h-11 text-base sm:h-10 sm:text-sm">
                  <Plus size={16} className="mr-2" />
                  New item
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCreating} onClose={resetForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTodo ? 'Edit item' : 'New item'}</DialogTitle>
            <DialogClose onClick={resetForm} />
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editingTodo) handleUpdate(); else handleCreate();
          }}>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="todo-title" className="mb-1.5 block text-sm font-medium text-ink-muted">Title</label>
                <Input
                  id="todo-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter item title..."
                  autoFocus
                  required
                />
              </div>
              <div>
                <label htmlFor="todo-description" className="mb-1.5 block text-sm font-medium text-ink-muted">Description (Optional)</label>
                <Textarea
                  id="todo-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add more details..."
                  rows={3}
                />
              </div>
              <div>
                <label htmlFor="todo-deadline" className="mb-1.5 block text-sm font-medium text-ink-muted">Deadline (Optional)</label>
                <Input
                  id="todo-deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  className={formData.deadline ? undefined : 'text-ink-faint'}
                />
              </div>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={!formData.title.trim()}
                >
                  {editingTodo ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <DragOverlay dropAnimation={null}>
        {activeTodo ? (
          <div className="rotate-1 cursor-grabbing">
            <TodoItem
              todo={activeTodo}
              onDelete={handleDelete}
              onRequestEdit={handleRequestEdit}
              onToggleComplete={handleToggleComplete}
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
