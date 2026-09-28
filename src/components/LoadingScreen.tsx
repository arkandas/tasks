'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const t = useTranslations('boards');

  return (
    <div role="status" className="flex h-full min-h-[60dvh] flex-col items-center justify-center gap-3 bg-canvas p-6">
      <Loader2 size={24} className="animate-spin text-ink-faint" />
      <p className="text-sm font-medium text-ink-muted">{message ?? t('loading')}</p>
    </div>
  );
}
