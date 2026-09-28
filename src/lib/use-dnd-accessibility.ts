'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Announcements, ScreenReaderInstructions } from '@dnd-kit/core';

export function useDndAccessibility() {
  const t = useTranslations('dragAndDrop');

  return useMemo(() => {
    const announcements: Announcements = {
      onDragStart: ({ active }) => t('pickedUp', { id: String(active.id) }),
      onDragOver: ({ active, over }) =>
        over
          ? t('movedOver', { id: String(active.id), over: String(over.id) })
          : t('notOver', { id: String(active.id) }),
      onDragEnd: ({ active, over }) =>
        over
          ? t('droppedOver', { id: String(active.id), over: String(over.id) })
          : t('dropped', { id: String(active.id) }),
      onDragCancel: ({ active }) => t('canceled', { id: String(active.id) }),
    };
    const screenReaderInstructions: ScreenReaderInstructions = { draggable: t('instructions') };

    return { announcements, screenReaderInstructions };
  }, [t]);
}
