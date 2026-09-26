import React from 'react';
import { cn } from '@/lib/utils';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full resize-none px-3.5 py-2.5 leading-relaxed rounded-lg border border-line-strong bg-raised text-base text-ink sm:text-sm shadow-xs transition-colors placeholder:text-ink-faint hover:border-ink-faint focus:border-accent focus:outline-hidden focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
