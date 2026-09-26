export function TasksMark({ size = 46, className }: { size?: number; className?: string }) {
  const ink = 'var(--accent-ink)';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className ? `shrink-0 ${className}` : 'shrink-0'}
    >
      <rect width="48" height="48" rx="11" fill="var(--accent)" />
      <path
        fill={ink}
        d="M11 13a2 2 0 0 1 2-2h22a2 2 0 0 1 2 2v14H27a2 2 0 0 0-2 2v8H13a2 2 0 0 1-2-2V13Z"
      />
      <path fill={ink} opacity="0.45" d="M27 37V29h10l-10 8Z" />
      <path
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21.6l4.4 4.4 9.4-10.2"
      />
    </svg>
  );
}
