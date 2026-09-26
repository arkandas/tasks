'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { Board as BoardType, SearchHit } from '@/types';
import { Board } from '@/components/Board';
import { BoardSidebar } from '@/components/BoardSidebar';
import { TasksMark } from '@/components/TasksMark';
import { Corkboard } from '@/components/Corkboard';
import { TodoList } from '@/components/TodoList';
import { UserMenu } from '@/components/UserMenu';
import { UserManagement } from '@/components/UserManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ErrorScreen } from '@/components/ErrorScreen';
import { LoadingScreen } from '@/components/LoadingScreen';
import { boardApi } from '@/lib/api';
import { Plus, Folder, StickyNote, Layout, ListTodo, X } from 'lucide-react';

type View = 'boards' | 'todos' | 'corkboard';

const VIEWS = [
  { view: 'boards', icon: Layout, label: 'Boards' },
  { view: 'todos', icon: ListTodo, label: 'To-Do' },
  { view: 'corkboard', icon: StickyNote, label: 'Sticky Notes' },
] as const;

export default function HomePage() {
  const [currentView, setCurrentView] = useState<View>('boards');
  const [boards, setBoards] = useState<BoardType[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<BoardType | null>(null);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBoardDrawer, setShowBoardDrawer] = useState(false);
  const [searchHit, setSearchHit] = useState<SearchHit | null>(null);
  const hasLoadedInitialBoard = useRef(false);
  const appShellRef = useRef<HTMLDivElement>(null);
  const searchHitTimer = useRef(0);

  const loadBoards = useCallback(() => {
    return boardApi.getAll()
      .then(async fetchedBoards => {
        setBoards(fetchedBoards);
        if (fetchedBoards.length > 0 && !hasLoadedInitialBoard.current) {
          const boardWithSections = await boardApi.getById(fetchedBoards[0].id);
          setSelectedBoard(boardWithSections);
          hasLoadedInitialBoard.current = true;
        }
      })
      .catch(error => {
        console.error('Failed to load boards:', error);
        setError('Unable to load your boards. Please check your database connection.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const retryLoadBoards = () => {
    setLoading(true);
    setError(null);
    loadBoards();
  };

  const handleCancelCreateBoard = () => {
    setIsCreatingBoard(false);
    setNewBoardTitle('');
    setNewBoardDescription('');
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;

    try {
      const newBoard = await boardApi.create({
        title: newBoardTitle,
        description: newBoardDescription || undefined,
      });

      setBoards(prev => [...prev, newBoard]);
      setNewBoardTitle('');
      setNewBoardDescription('');
      setIsCreatingBoard(false);

      const boardWithSections = await boardApi.getById(newBoard.id);
      setSelectedBoard(boardWithSections);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleSelectBoard = async (boardId: number) => {
    setShowBoardDrawer(false);
    try {
      const boardWithSections = await boardApi.getById(boardId);
      setSelectedBoard(boardWithSections);
    } catch (error) {
      console.error('Failed to load board:', error);
    }
  };

  const handleOpenHit = async (hit: SearchHit) => {
    setShowBoardDrawer(false);

    if (hit.type === 'task') {
      if (selectedBoard?.id !== hit.boardId) await handleSelectBoard(hit.boardId);
    } else {
      setCurrentView(hit.type === 'todo' ? 'todos' : 'corkboard');
    }

    setSearchHit(hit);
    window.clearTimeout(searchHitTimer.current);
    searchHitTimer.current = window.setTimeout(() => setSearchHit(null), 3500);
  };

  const updateBoardOptimistically = (boardId: number, updates: Partial<BoardType>) => {
    setBoards(prev => prev.map(board =>
      board.id === boardId ? { ...board, ...updates } : board
    ));

    setSelectedBoard(prev =>
      prev?.id === boardId ? { ...prev, ...updates } : prev
    );
  };

  const handleBoardUpdate = (updatedBoard: BoardType) => {
    setSelectedBoard(updatedBoard);
    updateBoardOptimistically(updatedBoard.id, {
      title: updatedBoard.title,
      description: updatedBoard.description
    });
  };

  const handleBoardDelete = async () => {
    const remainingBoards = boards.filter(board => board.id !== selectedBoard?.id);
    let nextBoard: BoardType | null = null;
    if (remainingBoards.length > 0) {
      try {
        nextBoard = await boardApi.getById(remainingBoards[0].id);
      } catch (error) {
        console.error('Failed to load board:', error);
      }
    }
    setBoards(remainingBoards);
    setSelectedBoard(nextBoard);
  };

  const handleBoardDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = boards.findIndex((b) => b.id === active.id);
    const newIndex = boards.findIndex((b) => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedBoards = [...boards];
    const [movedBoard] = reorderedBoards.splice(oldIndex, 1);
    reorderedBoards.splice(newIndex, 0, movedBoard);
    setBoards(reorderedBoards);

    try {
      await boardApi.reorder(active.id as number, newIndex);
    } catch (error) {
      console.error('Failed to reorder boards:', error);
      setBoards(boards);
    }
  };

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport || loading) return;

    let settleTimer = 0;

    const apply = () => {
      const shell = appShellRef.current;
      if (!shell || viewport.scale !== 1) return;

      const keyboardOpen = window.innerHeight - viewport.height > 150;
      if (keyboardOpen) return;

      shell.style.height = `${Math.round(viewport.height)}px`;
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    const handleChange = () => {
      apply();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(apply, 300);
    };

    handleChange();
    viewport.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);

    return () => {
      window.clearTimeout(settleTimer);
      viewport.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
    };
  }, [loading]);

  useEffect(() => {
    if (!showBoardDrawer) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowBoardDrawer(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBoardDrawer]);

  if (loading) {
    return (
      <div className="app-shell bg-canvas">
        <LoadingScreen />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell bg-canvas">
        <ErrorScreen error={error} onRetry={retryLoadBoards} />
      </div>
    );
  }

  return (
    <div ref={appShellRef} className="app-shell flex flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <div className="flex shrink-0 items-center gap-2">
            <TasksMark size={22} />
            <span className="hidden text-[15px] font-bold tracking-tight text-ink min-[360px]:inline">Tasks</span>
          </div>

          <nav aria-label="Views" className="flex items-center gap-0.5 rounded-lg border border-line bg-muted p-0.5 dark:bg-canvas">
            {VIEWS.map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => {
                  setCurrentView(view);
                  setShowBoardDrawer(false);
                }}
                title={label}
                aria-label={label}
                aria-current={currentView === view ? 'page' : undefined}
                className={`flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] transition-colors sm:h-8 ${
                  currentView === view
                    ? 'bg-accent font-semibold text-accent-ink shadow-sm'
                    : 'font-medium text-ink-muted hover:bg-surface hover:text-ink'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <UserMenu onOpenSettings={() => setShowUserManagement(true)} />
      </header>

      <UserManagement
        isOpen={showUserManagement}
        onClose={() => setShowUserManagement(false)}
      />

      <main className="flex-1 overflow-hidden">
        {currentView === 'corkboard' ? (
          <Corkboard highlightId={searchHit?.type === 'stickyNote' ? searchHit.id : null} />
        ) : currentView === 'todos' ? (
          <TodoList highlightId={searchHit?.type === 'todo' ? searchHit.id : null} />
        ) : (
          <div className="flex h-full">
            <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface md:flex">
              <BoardSidebar
                boards={boards}
                selectedBoardId={selectedBoard?.id}
                onReorder={handleBoardDragEnd}
                onSelect={handleSelectBoard}
                onCreate={() => setIsCreatingBoard(true)}
                onOpenHit={handleOpenHit}
              />
            </aside>

            <div className={`fixed inset-0 z-40 md:hidden ${showBoardDrawer ? '' : 'pointer-events-none'}`}>
              <div
                onClick={() => setShowBoardDrawer(false)}
                className={`absolute inset-0 bg-scrim transition-opacity duration-300 ${
                  showBoardDrawer ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <div
                className={`absolute inset-y-0 left-0 flex w-[84%] max-w-[320px] flex-col bg-surface shadow-2xl transition-[transform,visibility] duration-300 ease-out ${
                  showBoardDrawer ? 'visible translate-x-0' : 'invisible -translate-x-full'
                }`}
                role="dialog"
                aria-label="Boards"
              >
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
                  <span className="text-base font-bold tracking-tight text-ink">Boards</span>
                  <button
                    onClick={() => setShowBoardDrawer(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink"
                    aria-label="Close board list"
                  >
                    <X size={18} />
                  </button>
                </div>
                <BoardSidebar
                  boards={boards}
                  selectedBoardId={selectedBoard?.id}
                  onReorder={handleBoardDragEnd}
                  onSelect={handleSelectBoard}
                  onCreate={() => {
                    setShowBoardDrawer(false);
                    setIsCreatingBoard(true);
                  }}
                  onOpenHit={handleOpenHit}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <Dialog open={isCreatingBoard} onClose={handleCancelCreateBoard}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Board</DialogTitle>
                    <DialogClose onClick={handleCancelCreateBoard} />
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateBoard();
                    }}
                    className="space-y-4 sm:space-y-5"
                  >
                    <div>
                      <label htmlFor="board-title" className="mb-1.5 block text-sm font-medium text-ink-muted">Board Title</label>
                      <Input
                        id="board-title"
                        value={newBoardTitle}
                        onChange={(e) => setNewBoardTitle(e.target.value)}
                        placeholder="Enter board title..."
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor="board-description" className="mb-1.5 block text-sm font-medium text-ink-muted">Description (Optional)</label>
                      <Textarea
                        id="board-description"
                        value={newBoardDescription}
                        onChange={(e) => setNewBoardDescription(e.target.value)}
                        placeholder="Describe what this board is for..."
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3 sm:pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={handleCancelCreateBoard}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="w-full sm:w-auto" disabled={!newBoardTitle.trim()}>
                        Create Board
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {selectedBoard ? (
                <Board
                  board={selectedBoard}
                  onUpdate={handleBoardUpdate}
                  onDelete={handleBoardDelete}
                  onOpenBoardList={() => setShowBoardDrawer(true)}
                  highlightTaskId={searchHit?.type === 'task' ? searchHit.id : null}
                />
              ) : boards.length === 0 ? (
                <div className="flex h-full items-center justify-center p-6">
                  <div className="text-center">
                    <Folder size={64} className="mx-auto mb-4 text-ink-faint" />
                    <h2 className="mb-2 text-xl font-semibold text-ink">No boards yet</h2>
                    <p className="mb-5 text-ink-muted">Create your first board to get started</p>
                    <Button onClick={() => setIsCreatingBoard(true)} className="h-11 text-base sm:h-10 sm:text-sm">
                      <Plus size={16} className="mr-2" />
                      Create Board
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-6">
                  <div className="text-center">
                    <h2 className="mb-2 text-xl font-semibold text-ink">Select a board</h2>
                    <p className="text-ink-muted">
                      <span className="hidden md:inline">Choose a board from the sidebar to view its contents</span>
                      <span className="md:hidden">Choose a board to view its contents</span>
                    </p>
                    <Button className="mt-4 h-11 text-base md:hidden" onClick={() => setShowBoardDrawer(true)}>
                      <Layout size={16} className="mr-2" />
                      Browse boards
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
