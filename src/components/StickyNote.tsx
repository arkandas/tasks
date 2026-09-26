'use client';

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { StickyNote, UpdateStickyNote } from '@/types';
import { STICKY_COLORS, stickyColorClass } from '@/lib/sticky-colors';
import { Edit2, Trash2, Palette } from 'lucide-react';

interface StickyNoteProps {
  stickyNote: StickyNote;
  onUpdate: (id: number, updates: UpdateStickyNote) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isHighlighted?: boolean;
}

export function StickyNote({ stickyNote, onUpdate, onDelete, isHighlighted = false }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(stickyNote.content);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const bringToFront = () => {
    onUpdate(stickyNote.id, {});
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: stickyNote.id,
    data: {
      type: 'stickynote',
      stickyNote,
    },
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    opacity: isDragging ? 0 : 1,
    position: 'absolute' as const,
    left: `min(${stickyNote.position_x}px, calc(100vw - ${stickyNote.width}px - 20px))`,
    top: stickyNote.position_y,
    width: `min(${stickyNote.width}px, calc(100vw - 40px))`,
    height: stickyNote.height,
    zIndex: isDragging || showColorPicker || isHighlighted ? 1000 : (stickyNote.z_index || 0),
  };

  const handleSave = async () => {
    try {
      await onUpdate(stickyNote.id, { content });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update sticky note:', error);
    }
  };

  const handleCancel = () => {
    setContent(stickyNote.content);
    setIsEditing(false);
  };

  const handleColorChange = async (color: StickyNote['color']) => {
    try {
      await onUpdate(stickyNote.id, { color });
      setShowColorPicker(false);
    } catch (error) {
      console.error('Failed to update sticky note color:', error);
    }
  };

  const menuButton = 'flex h-8 w-8 items-center justify-center rounded-md transition-colors';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${stickyColorClass(stickyNote.color)} group cursor-grab rounded-lg border-2 p-3 shadow-lg transition-shadow duration-200 hover:shadow-xl active:cursor-grabbing ${isHighlighted ? 'search-hit' : ''}`}
    >
      <div
        className={`sticky-menu absolute -right-2 -top-4 flex gap-0.5 rounded-lg border p-1 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 ${
          showColorPicker ? 'opacity-100' : 'opacity-0'
        }`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          className={menuButton}
          title="Change color"
          aria-label="Change color"
          aria-expanded={showColorPicker}
        >
          <Palette size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            bringToFront();
            setIsEditing(true);
          }}
          className={menuButton}
          title="Edit sticky note"
          aria-label="Edit sticky note"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(stickyNote.id);
          }}
          className={`${menuButton} is-danger`}
          title="Delete sticky note"
          aria-label="Delete sticky note"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {showColorPicker && (
        <div
          className="sticky-menu absolute right-0 top-8 z-50 rounded-xl border p-2.5 shadow-xl"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="grid w-max grid-cols-3 gap-2">
            {STICKY_COLORS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleColorChange(option.value)}
                style={{ backgroundColor: 'var(--sticky)', borderColor: 'var(--sticky-edge)' }}
                className={`sticky-${option.value} h-8 w-8 rounded-md border-2 transition-transform duration-200 hover:scale-110 ${
                  option.value === stickyNote.color ? 'ring-2 ring-gray-800 ring-offset-2 ring-offset-white' : ''
                }`}
                title={option.name}
                aria-label={option.name}
                aria-pressed={option.value === stickyNote.color}
              />
            ))}
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="flex h-full flex-col" onPointerDown={(e) => e.stopPropagation()}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="h-full w-full flex-1 resize-none overflow-y-auto border-none p-0 text-sm outline-hidden [overflow-wrap:anywhere]"
            placeholder="Write your note..."
            aria-label="Sticky note text"
            maxLength={500}
            autoFocus
          />
          <div className="mt-2 flex gap-1.5">
            <button type="button" onClick={handleSave} className="sticky-save">
              Save
            </button>
            <button type="button" onClick={handleCancel} className="sticky-cancel">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="markdown-content themed-scroll h-full overflow-y-auto text-sm" onClick={(e) => e.stopPropagation()}>
          {stickyNote.content ? (
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
              {stickyNote.content}
            </ReactMarkdown>
          ) : (
            <span className="sticky-muted">Write your note...</span>
          )}
        </div>
      )}
    </div>
  );
}
