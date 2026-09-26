'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose onClick={onCancel} />
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-ink-muted">{children}</div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} className="w-full sm:w-auto" autoFocus>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
