'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
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
  confirmLabel,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const t = useTranslations('common');

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
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={onConfirm} className="w-full sm:w-auto" autoFocus>
              {confirmLabel ?? t('delete')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
