import type { StickyNote } from '@/types';

export const STICKY_COLORS: Array<StickyNote['color']> = [
  'yellow',
  'blue',
  'green',
  'pink',
  'orange',
  'purple',
  'cyan',
  'red',
  'lime',
];

export function stickyColorClass(color: string) {
  const known = STICKY_COLORS.some(value => value === color);
  return `sticky-note sticky-${known ? color : 'yellow'}`;
}
