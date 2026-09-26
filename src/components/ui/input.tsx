import React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 sm:h-10 w-full px-3.5 py-2 rounded-lg border border-line-strong bg-raised text-base text-ink sm:text-sm shadow-xs transition-colors placeholder:text-ink-faint hover:border-ink-faint focus:border-accent focus:outline-hidden focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
