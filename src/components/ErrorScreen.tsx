'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Database,
  RefreshCw,
  Zap,
  Settings,
  HelpCircle
} from 'lucide-react';

type ErrorType = 'database' | 'network' | 'timeout' | 'general';

interface ErrorScreenProps {
  error?: string | null;
  type?: ErrorType;
  onRetry?: () => void;
  showRetry?: boolean;
}

const getErrorType = (error: string): ErrorType => {
  const errorLower = error.toLowerCase();

  if (errorLower.includes('database') || errorLower.includes('prisma') || errorLower.includes('connection')) {
    return 'database';
  }
  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return 'network';
  }
  if (errorLower.includes('timeout')) {
    return 'timeout';
  }
  return 'general';
};

const ERROR_ICONS = {
  database: Database,
  network: Zap,
  timeout: RefreshCw,
  general: AlertTriangle,
};

const TIPS = ['tip1', 'tip2', 'tip3'] as const;

export function ErrorScreen({ error, type, onRetry, showRetry = true }: ErrorScreenProps) {
  const t = useTranslations('errorScreen');
  const message = error || t('unexpected');
  const errorType = type ?? getErrorType(message);
  const IconComponent = ERROR_ICONS[errorType];

  return (
    <div className="themed-scroll flex h-full min-h-[60dvh] items-center justify-center overflow-y-auto bg-canvas p-4">
      <div className="w-full max-w-md py-6">
        <div role="alert" className="rounded-2xl border border-line bg-surface p-6 text-center shadow-xs sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
            <IconComponent size={26} />
          </div>

          <h1 className="mb-2 text-xl font-bold text-ink">
            {t(`${errorType}.title`)}
          </h1>

          <p className="leading-relaxed text-ink-muted">
            {t(`${errorType}.description`)}
          </p>

          {showRetry && onRetry && (
            <Button onClick={onRetry} className="mt-6 h-11 text-base sm:h-10 sm:text-sm">
              <RefreshCw size={16} className="mr-2" />
              {t('tryAgain')}
            </Button>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle size={17} className="text-ink-faint" />
            <h3 className="text-sm font-semibold text-ink">{t('whatToTry')}</h3>
          </div>
          <ul className="space-y-2 text-sm text-ink-muted">
            {TIPS.map(tip => (
              <li key={tip} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />
                <span>{t(`${errorType}.${tip}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <details className="mt-4 rounded-xl border border-line bg-surface">
          <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm text-ink-muted transition-colors hover:text-ink">
            <Settings size={15} />
            {t('technicalDetails')}
          </summary>
          <div className="border-t border-line px-4 pb-4">
            <code className="mt-3 block break-all rounded-md bg-canvas p-2.5 font-mono text-xs text-ink-muted">
              {message}
            </code>
          </div>
        </details>
      </div>
    </div>
  );
}
