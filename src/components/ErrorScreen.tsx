'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Database,
  RefreshCw,
  Zap,
  Settings,
  HelpCircle
} from 'lucide-react';

interface ErrorScreenProps {
  error?: string | null;
  onRetry?: () => void;
  showRetry?: boolean;
}

const getErrorType = (error: string) => {
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

const getErrorDetails = (error: string) => {
  const type = getErrorType(error);

  switch (type) {
    case 'database':
      return {
        icon: Database,
        title: 'Database Connection Issue',
        description: 'Unable to connect to the database. This might be a temporary issue.',
        suggestions: [
          'Check if the database is running',
          'Verify database connection settings',
          'Try refreshing the page'
        ],
      };
    case 'network':
      return {
        icon: Zap,
        title: 'Network Connection Error',
        description: 'Unable to reach the server. Please check your internet connection.',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ],
      };
    case 'timeout':
      return {
        icon: RefreshCw,
        title: 'Request Timeout',
        description: 'The request took too long to complete.',
        suggestions: [
          'The server might be busy',
          'Try again in a moment',
          'Check your connection speed'
        ],
      };
    default:
      return {
        icon: AlertTriangle,
        title: 'Something went wrong',
        description: 'An unexpected error occurred while loading your data.',
        suggestions: [
          'Try refreshing the page',
          'Check if the issue persists',
          'Check the server logs if the problem continues'
        ],
      };
  }
};

export function ErrorScreen({ error = 'An unexpected error occurred', onRetry, showRetry = true }: ErrorScreenProps) {
  const message = error || 'An unexpected error occurred';
  const errorDetails = getErrorDetails(message);
  const IconComponent = errorDetails.icon;

  return (
    <div className="themed-scroll flex h-full min-h-[60dvh] items-center justify-center overflow-y-auto bg-canvas p-4">
      <div className="w-full max-w-md py-6">
        <div role="alert" className="rounded-2xl border border-line bg-surface p-6 text-center shadow-xs sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
            <IconComponent size={26} />
          </div>

          <h1 className="mb-2 text-xl font-bold text-ink">
            {errorDetails.title}
          </h1>

          <p className="leading-relaxed text-ink-muted">
            {errorDetails.description}
          </p>

          {showRetry && onRetry && (
            <Button onClick={onRetry} className="mt-6 h-11 text-base sm:h-10 sm:text-sm">
              <RefreshCw size={16} className="mr-2" />
              Try Again
            </Button>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-line bg-surface p-5">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle size={17} className="text-ink-faint" />
            <h3 className="text-sm font-semibold text-ink">What you can try</h3>
          </div>
          <ul className="space-y-2 text-sm text-ink-muted">
            {errorDetails.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        <details className="mt-4 rounded-xl border border-line bg-surface">
          <summary className="flex cursor-pointer items-center gap-2 p-4 text-sm text-ink-muted transition-colors hover:text-ink">
            <Settings size={15} />
            Technical Details
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
