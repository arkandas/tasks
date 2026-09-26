export interface Board {
  id: number;
  title: string;
  description?: string | null;
  position: number;
  created_at: string;
  updated_at?: string;
  sections: Section[];
}

export interface Section {
  id: number;
  title: string;
  position: number;
  board_id: number;
  created_at: string;
  updated_at?: string;
  tasks: Task[];
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  deadline?: string | null;
  completed: boolean;
  section_id: number;
  created_at: string;
  updated_at?: string;
  comments: Comment[];
}

interface Comment {
  id: number;
  content: string;
  task_id: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateBoard {
  title: string;
  description?: string;
}

export interface UpdateBoard {
  title?: string;
  description?: string | null;
}

export interface CreateSection {
  title: string;
  board_id: number;
  position?: number;
}

export interface UpdateSection {
  title?: string;
  position?: number;
}

export interface CreateTask {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline?: string;
  section_id: number;
  position?: number;
}

export interface UpdateTask {
  title?: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline?: string | null;
  completed?: boolean;
  section_id?: number;
  position?: number;
}

export interface StickyNote {
  id: number;
  content: string;
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'orange' | 'purple' | 'cyan' | 'red' | 'lime';
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index?: number;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateStickyNote {
  content: string;
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'orange' | 'purple' | 'cyan' | 'red' | 'lime';
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  z_index?: number;
}

export interface UpdateStickyNote {
  content?: string;
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'orange' | 'purple' | 'cyan' | 'red' | 'lime';
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  z_index?: number;
}

export interface TodoItem {
  id: number;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  deadline?: string | null;
  completed: boolean;
  user_id: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateTodoItem {
  title: string;
  description?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline?: string;
  position?: number;
}

export interface UpdateTodoItem {
  title?: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline?: string | null;
  completed?: boolean;
  position?: number;
}

export interface SearchResults {
  tasks: Array<{
    id: number;
    title: string;
    description: string | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    section_id: number;
    section_title: string;
    board_id: number;
    board_title: string;
  }>;
  todos: Array<{
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
  }>;
  stickyNotes: Array<{
    id: number;
    content: string;
    color: StickyNote['color'];
  }>;
}

export type SearchHit =
  | { type: 'task'; id: number; boardId: number }
  | { type: 'todo'; id: number }
  | { type: 'stickyNote'; id: number };

