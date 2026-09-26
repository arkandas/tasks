'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
}

interface DialogTitleProps {
  children: React.ReactNode;
}

const TEXT_ENTRY_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number']);

function isTextField(node: EventTarget | null) {
  if (document.activeElement !== node) return false;
  if (node instanceof HTMLTextAreaElement) return true;
  return node instanceof HTMLInputElement && TEXT_ENTRY_TYPES.has(node.type);
}

function useDialogViewport(open: boolean) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!open || !overlay) return;

    let startY = 0;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startY = event.touches[0].clientY;
    };

    const scrollerFor = (target: EventTarget | null, deltaY: number) => {
      let node = target instanceof Element ? target : null;

      while (node && node !== overlay) {
        if (node instanceof HTMLElement && node.scrollHeight > node.clientHeight) {
          const overflowY = getComputedStyle(node).overflowY;

          if (overflowY === 'auto' || overflowY === 'scroll') {
            const atTop = node.scrollTop <= 0;
            const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;

            if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) return null;
            return node;
          }
        }

        node = node.parentElement;
      }

      return null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!event.cancelable || event.touches.length > 1) return;
      if (isTextField(event.target)) return;

      const deltaY = event.touches[0].clientY - startY;
      if (!scrollerFor(event.target, deltaY)) event.preventDefault();
    };

    overlay.addEventListener('touchstart', handleTouchStart, { passive: true });
    overlay.addEventListener('touchmove', handleTouchMove, { passive: false });

    const viewport = window.visualViewport;

    const detachTouch = () => {
      overlay.removeEventListener('touchstart', handleTouchStart);
      overlay.removeEventListener('touchmove', handleTouchMove);
    };

    if (!viewport) return detachTouch;

    let frame = 0;
    let revealTimer = 0;

    const sync = () => {
      frame = 0;
      overlay.style.height = `${viewport.height}px`;
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    const handleResize = () => {
      schedule();
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.closest('.dialog-panel')) {
          active.scrollIntoView({ block: 'nearest' });
        }
      }, 150);
    };

    sync();
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(revealTimer);
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', schedule);
      detachTouch();
      overlay.style.height = '';
    };
  }, [open]);

  return overlayRef;
}

export function Dialog({ open, onClose, children }: DialogProps) {
  const overlayRef = useDialogViewport(open);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center"
    >
      <div
        className="fixed inset-0 touch-none bg-scrim sm:backdrop-blur-xs"
        onClick={onClose}
      />
      {children}
    </div>
  );
}

export function DialogContent({ children, className = "" }: DialogContentProps) {
  const defaultClasses =
    "dialog-panel relative z-10 w-full rounded-2xl border border-line-strong bg-surface p-4 shadow-2xl sm:p-6";
  const widthClass = className.includes("max-w-") ? "" : "sm:max-w-md";
  return (
    <div role="dialog" aria-modal="true" className={`${defaultClasses} ${widthClass} ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return (
    <div className="-mx-4 -mt-4 mb-4 flex items-center justify-between rounded-t-2xl border-b border-line bg-raised px-4 py-3 sm:-mx-6 sm:-mt-6 sm:mb-5 sm:px-6 sm:py-4">
      {children}
    </div>
  );
}

export function DialogTitle({ children }: DialogTitleProps) {
  return (
    <h2 className="text-base font-semibold text-ink sm:text-lg">
      {children}
    </h2>
  );
}

interface DialogCloseProps {
  onClick: () => void;
}

export function DialogClose({ onClick }: DialogCloseProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-muted hover:text-ink"
      aria-label="Close"
    >
      <X size={18} />
    </button>
  );
}
