import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'h-11 sm:h-10 w-full cursor-pointer appearance-none pl-3.5 pr-10 rounded-lg border border-line-strong bg-raised text-base text-ink sm:text-sm shadow-xs transition-colors placeholder:text-ink-faint hover:border-ink-faint focus:border-accent focus:outline-hidden focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
