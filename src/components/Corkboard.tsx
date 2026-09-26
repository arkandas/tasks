'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StickyNote, CreateStickyNote, UpdateStickyNote } from '@/types';
import { StickyNote as StickyNoteComponent } from './StickyNote';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';
import { stickyNoteApi } from '@/lib/api';
import { stickyColorClass } from '@/lib/sticky-colors';
import { Plus, Trash2, RotateCcw } from 'lucide-react';

function withZIndex(notes: StickyNote[]) {
  if (!notes.some(note => note.z_index == null)) return notes;

  const existingZIndices = notes
    .map(s => s.z_index)
    .filter((z): z is number => z != null);
  const maxExistingZIndex = existingZIndices.length > 0 ? Math.max(...existingZIndices) : -1;

  return notes.map((note, index) =>
    note.z_index == null ? { ...note, z_index: maxExistingZIndex + 1 + index } : note
  );
}

export function Corkboard({ highlightId = null }: { highlightId?: number | null }) {
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<StickyNote[]>([]);
  const [showTrash, setShowTrash] = useState(false);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [activeStickyNote, setActiveStickyNote] = useState<StickyNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const loadStickyNotes = () =>
    stickyNoteApi.getAll()
      .then(fetchedStickyNotes => setStickyNotes(withZIndex(fetchedStickyNotes)))
      .catch(error => {
        console.error('Failed to load sticky notes:', error);
        setError('Unable to load your sticky notes. Please check your database connection.');
      })
      .finally(() => setLoading(false));

  const loadDeletedNotes = () =>
    stickyNoteApi.getDeleted()
      .then(setDeletedNotes)
      .catch(error => console.error('Failed to load deleted notes:', error));

  useEffect(() => {
    loadStickyNotes();
    loadDeletedNotes();
  }, []);

  const retryLoadStickyNotes = () => {
    setError(null);
    setLoading(true);
    loadStickyNotes();
  };

  const handleCreateStickyNote = async () => {
    try {
      const board = boardRef.current;
      const boardWidth = board?.clientWidth ?? window.innerWidth;
      const boardHeight = board?.clientHeight ?? window.innerHeight;
      const padding = 20;
      const topReserve = 72;
      const stickyNoteWidth = 200;
      const stickyNoteHeight = 200;

      const minX = padding;
      const maxX = Math.max(minX, boardWidth - stickyNoteWidth - padding);
      const minY = topReserve;
      const maxY = Math.max(minY, boardHeight - stickyNoteHeight - padding);

      const maxZIndex = Math.max(0, ...stickyNotes.map(s => s.z_index || 0));

      const newStickyNote: CreateStickyNote = {
        content: '',
        color: 'yellow',
        position_x: Math.max(minX, Math.min(maxX, padding + Math.random() * (maxX - minX))),
        position_y: Math.max(minY, Math.min(maxY, minY + Math.random() * (maxY - minY))),
        width: stickyNoteWidth,
        height: stickyNoteHeight,
        z_index: maxZIndex + 1,
      };

      const createdStickyNote = await stickyNoteApi.create(newStickyNote);
      setStickyNotes(prev => [...prev, createdStickyNote]);
    } catch (error) {
      console.error('Failed to create sticky note:', error);
    }
  };

  const normalizeZIndices = () => {
    const sorted = [...stickyNotes].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));
    return sorted.map((note, index) => ({ ...note, z_index: index }));
  };

  const handleUpdateStickyNote = async (id: number, updates: UpdateStickyNote) => {
    try {
      const shouldBringToFront = Object.keys(updates).length === 0;

      if (shouldBringToFront) {
        const maxZIndex = Math.max(0, ...stickyNotes.map(s => s.z_index || 0));

        if (maxZIndex > 1000) {
          const normalized = normalizeZIndices();
          setStickyNotes(normalized);
          await Promise.all(normalized.map(note =>
            stickyNoteApi.update(note.id, { z_index: note.z_index })
          ));
          updates.z_index = stickyNotes.length;
        } else {
          updates.z_index = maxZIndex + 1;
        }
      }

      await stickyNoteApi.update(id, updates);
      setStickyNotes(prev => prev.map(stickyNote =>
        stickyNote.id === id ? { ...stickyNote, ...updates } : stickyNote
      ));
    } catch (error) {
      console.error('Failed to update sticky note:', error);
    }
  };

  const handleDeleteStickyNote = async (id: number) => {
    try {
      await stickyNoteApi.delete(id);
      setStickyNotes(prev => prev.filter(stickyNote => stickyNote.id !== id));
      await loadDeletedNotes();
    } catch (error) {
      console.error('Failed to delete sticky note:', error);
    }
  };

  const handleRestoreStickyNote = async (id: number) => {
    try {
      const restored = await stickyNoteApi.restore(id);
      setStickyNotes(prev => [...prev, restored]);
      setDeletedNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Failed to restore sticky note:', error);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await stickyNoteApi.emptyTrash();
      setDeletedNotes([]);
    } catch (error) {
      console.error('Failed to empty trash:', error);
    } finally {
      setConfirmEmptyTrash(false);
    }
  };

  const handleDragStart = (event: { active: { data: { current?: { type?: string; stickyNote?: StickyNote } } } }) => {
    const { active } = event;
    if (active.data.current?.type === 'stickynote') {
      setActiveStickyNote(active.data.current.stickyNote || null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveStickyNote(null);

    if (active.data.current?.type === 'stickynote') {
      const stickyNote = active.data.current.stickyNote as StickyNote;

      const board = boardRef.current;
      const boardWidth = board?.clientWidth ?? window.innerWidth;
      const boardHeight = board?.clientHeight ?? window.innerHeight;
      const padding = 20;

      const minX = padding;
      const maxX = Math.max(minX, boardWidth - stickyNote.width - padding);
      const minY = padding;
      const maxY = Math.max(minY, boardHeight - stickyNote.height - padding);

      const newPosition = {
        position_x: Math.max(minX, Math.min(maxX, stickyNote.position_x + delta.x)),
        position_y: Math.max(minY, Math.min(maxY, stickyNote.position_y + delta.y)),
      };

      const maxZIndex = Math.max(0, ...stickyNotes.map(s => s.z_index || 0));
      const newZIndex = maxZIndex + 1;

      if (newPosition.position_x !== stickyNote.position_x || newPosition.position_y !== stickyNote.position_y) {
        setStickyNotes(prev => prev.map(p =>
          p.id === stickyNote.id ? { ...p, ...newPosition, z_index: newZIndex } : p
        ));

        try {
          await stickyNoteApi.update(stickyNote.id, { ...newPosition, z_index: newZIndex });
        } catch (error) {
          console.error('Failed to update sticky note position:', error);
          setStickyNotes(prev => prev.map(p =>
            p.id === stickyNote.id ? { ...p, position_x: stickyNote.position_x, position_y: stickyNote.position_y, z_index: stickyNote.z_index } : p
          ));
        }
      }
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading your sticky notes..." />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={retryLoadStickyNotes} />;
  }

  const floatingButton = 'h-9 border bg-surface shadow-md sm:h-8';
  const trashVisible = showTrash && !highlightId;

  return (
    <div ref={boardRef} className="corkboard theme-light relative isolate h-full overflow-hidden">
      {trashVisible && (
        <div className="absolute left-3 top-3 z-[1100] sm:left-4 sm:top-4">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink shadow-md sm:h-8">
            Trash
            {deletedNotes.length > 0 && (
              <span className="font-normal tabular-nums text-ink-muted">{deletedNotes.length} / 50</span>
            )}
          </span>
        </div>
      )}

      <div className="absolute right-3 top-3 z-[1100] flex gap-2 sm:right-4 sm:top-4">
        {trashVisible ? (
          <>
            {deletedNotes.length > 0 && (
              confirmEmptyTrash ? (
                <>
                  <Button
                    onClick={handleEmptyTrash}
                    variant="destructive"
                    size="sm"
                    className="h-9 shadow-md sm:h-8"
                  >
                    Delete {deletedNotes.length}
                  </Button>
                  <Button
                    onClick={() => setConfirmEmptyTrash(false)}
                    variant="outline"
                    size="sm"
                    className={floatingButton}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setConfirmEmptyTrash(true)}
                  variant="outline"
                  size="sm"
                  className={`${floatingButton} text-danger hover:bg-danger-soft`}
                  aria-label="Empty trash"
                >
                  <Trash2 size={15} className="sm:mr-2" />
                  <span className="hidden sm:inline">Empty trash</span>
                </Button>
              )
            )}
            <Button
              onClick={() => {
                setShowTrash(false);
                setConfirmEmptyTrash(false);
              }}
              variant="outline"
              size="sm"
              className={floatingButton}
              aria-label="Back to notes"
            >
              <RotateCcw size={15} className="sm:mr-2" />
              <span className="hidden sm:inline">Back to notes</span>
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setShowTrash(true)}
              variant="outline"
              size="sm"
              className={floatingButton}
              aria-label={`Trash (${deletedNotes.length})`}
            >
              <Trash2 size={15} className="mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Trash</span>
              <span className="tabular-nums text-ink-muted sm:ml-1.5">{deletedNotes.length}</span>
            </Button>
            <Button
              onClick={handleCreateStickyNote}
              size="sm"
              className="h-9 shadow-md sm:h-8"
              aria-label="Add note"
            >
              <Plus size={15} className="sm:mr-1.5" />
              <span className="hidden sm:inline">Add note</span>
            </Button>
          </>
        )}
      </div>

      <div className="absolute inset-0">
        {trashVisible ? (
          <div className="themed-scroll h-full overflow-y-auto overscroll-contain px-4 pb-8 pt-16 sm:px-8 sm:pt-20">
            {deletedNotes.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-6xl">🗑️</div>
                  <h2 className="mb-2 text-xl font-semibold text-ink">The trash is empty</h2>
                  <p className="text-ink-muted">Deleted sticky notes will appear here</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {deletedNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`${stickyColorClass(note.color)} relative flex h-48 flex-col rounded-lg border-2 p-4 shadow-lg`}
                  >
                    <button
                      onClick={() => handleRestoreStickyNote(note.id)}
                      className="sticky-menu absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border shadow-md transition-transform hover:scale-110"
                      title="Restore note"
                      aria-label="Restore note"
                    >
                      <RotateCcw size={15} />
                    </button>
                    <div className="markdown-content themed-scroll flex-1 overflow-y-auto pr-9 text-sm">
                      {note.content ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {note.content}
                        </ReactMarkdown>
                      ) : (
                        <span className="sticky-muted">Empty note</span>
                      )}
                    </div>
                    <div className="sticky-rule sticky-muted mt-2 border-t pt-2 text-xs">
                      Deleted {new Date(note.deleted_at!).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {stickyNotes.map((stickyNote) => (
              <StickyNoteComponent
                key={stickyNote.id}
                stickyNote={stickyNote}
                onUpdate={handleUpdateStickyNote}
                onDelete={handleDeleteStickyNote}
                isHighlighted={highlightId === stickyNote.id}
              />
            ))}

            <DragOverlay>
              {activeStickyNote ? (
                <div
                  className={`${stickyColorClass(activeStickyNote.color)} rotate-2 scale-105 rounded-lg border-2 p-3 opacity-95 shadow-2xl`}
                  style={{
                    width: activeStickyNote.width,
                    height: activeStickyNote.height,
                  }}
                >
                  <div className="markdown-content h-full overflow-hidden text-sm">
                    {activeStickyNote.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {activeStickyNote.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="sticky-muted">Write your note...</span>
                    )}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {!trashVisible && stickyNotes.length === 0 && (
          <div className="flex h-full items-center justify-center p-6">
            <div className="text-center">
              <div className="mb-4 text-6xl">📋</div>
              <h2 className="mb-2 text-xl font-semibold text-ink">No sticky notes yet</h2>
              <p className="mb-5 text-ink-muted">Create your first sticky note to get started</p>
              <Button onClick={handleCreateStickyNote} className="h-11 text-base sm:h-10 sm:text-sm">
                <Plus size={16} className="mr-2" />
                Create Sticky Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
