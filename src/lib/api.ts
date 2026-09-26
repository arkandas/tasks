import {
  Board,
  Section,
  Task,
  StickyNote,
  TodoItem,
  CreateBoard,
  UpdateBoard,
  CreateSection,
  UpdateSection,
  CreateTask,
  UpdateTask,
  CreateStickyNote,
  UpdateStickyNote,
  CreateTodoItem,
  UpdateTodoItem,
  SearchResults,
} from '@/types';

export const boardApi = {
  getAll: async (): Promise<Board[]> => {
    const response = await fetch('/api/boards');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Database connection failed (${response.status})`);
    }
    return response.json();
  },

  getById: async (id: number): Promise<Board> => {
    const response = await fetch(`/api/boards/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch board');
    }
    return response.json();
  },

  create: async (board: CreateBoard): Promise<Board> => {
    const response = await fetch('/api/boards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(board),
    });
    if (!response.ok) {
      throw new Error('Failed to create board');
    }
    return response.json();
  },

  update: async (id: number, board: UpdateBoard): Promise<Board> => {
    const response = await fetch(`/api/boards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(board),
    });
    if (!response.ok) {
      throw new Error('Failed to update board');
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/boards/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete board');
    }
  },

  reorder: async (boardId: number, newPosition: number): Promise<void> => {
    const response = await fetch('/api/boards/reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ boardId, newPosition }),
    });
    if (!response.ok) {
      throw new Error('Failed to reorder boards');
    }
  },
};

export const sectionApi = {
  create: async (section: CreateSection): Promise<Section> => {
    const response = await fetch('/api/sections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(section),
    });
    if (!response.ok) {
      throw new Error('Failed to create section');
    }
    return response.json();
  },

  update: async (id: number, section: UpdateSection): Promise<Section> => {
    const response = await fetch(`/api/sections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(section),
    });
    if (!response.ok) {
      throw new Error('Failed to update section');
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/sections/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete section');
    }
  },
};

export const taskApi = {
  create: async (task: CreateTask): Promise<Task> => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json();
  },

  update: async (id: number, task: UpdateTask): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    return response.json();
  },

  move: async (id: number, newSectionId: number, newPosition: number): Promise<void> => {
    const response = await fetch(`/api/tasks/${id}/move?new_section_id=${newSectionId}&new_position=${newPosition}`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to move task');
    }
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  },
};

export const stickyNoteApi = {
  getAll: async (): Promise<StickyNote[]> => {
    const response = await fetch('/api/stickynotes');
    if (!response.ok) {
      throw new Error('Failed to fetch sticky notes');
    }
    return response.json();
  },

  create: async (stickyNote: CreateStickyNote): Promise<StickyNote> => {
    const response = await fetch('/api/stickynotes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stickyNote),
    });
    if (!response.ok) {
      throw new Error('Failed to create sticky note');
    }
    return response.json();
  },

  update: async (id: number, stickyNote: UpdateStickyNote): Promise<StickyNote> => {
    const response = await fetch(`/api/stickynotes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stickyNote),
    });
    if (!response.ok) {
      throw new Error('Failed to update sticky note');
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/stickynotes/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete sticky note');
    }
  },

  getDeleted: async (): Promise<StickyNote[]> => {
    const response = await fetch('/api/stickynotes/trash');
    if (!response.ok) {
      throw new Error('Failed to fetch deleted sticky notes');
    }
    return response.json();
  },

  restore: async (id: number): Promise<StickyNote> => {
    const response = await fetch(`/api/stickynotes/${id}/restore`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to restore sticky note');
    }
    return response.json();
  },

  emptyTrash: async (): Promise<void> => {
    const response = await fetch('/api/stickynotes/trash', {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to empty trash');
    }
  },
};

export const todoApi = {
  getAll: async (): Promise<TodoItem[]> => {
    const response = await fetch('/api/todos');
    if (!response.ok) {
      throw new Error('Failed to fetch todos');
    }
    return response.json();
  },

  create: async (todo: CreateTodoItem): Promise<TodoItem> => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todo),
    });
    if (!response.ok) {
      throw new Error('Failed to create todo');
    }
    return response.json();
  },

  update: async (id: number, todo: UpdateTodoItem): Promise<TodoItem> => {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todo),
    });
    if (!response.ok) {
      throw new Error('Failed to update todo');
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete todo');
    }
  },
};

export const searchApi = {
  search: async (query: string, signal?: AbortSignal): Promise<SearchResults> => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
    if (!response.ok) throw new Error('Failed to search');
    return response.json();
  },
};
