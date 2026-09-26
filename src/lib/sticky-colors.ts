import type { StickyNote } from '@/types';

export const STICKY_COLORS: Array<{ value: StickyNote['color']; name: string }> = [
  { value: 'yellow', name: 'Yellow' },
  { value: 'blue', name: 'Blue' },
  { value: 'green', name: 'Green' },
  { value: 'pink', name: 'Pink' },
  { value: 'orange', name: 'Orange' },
  { value: 'purple', name: 'Purple' },
  { value: 'cyan', name: 'Cyan' },
  { value: 'red', name: 'Red' },
  { value: 'lime', name: 'Lime' },
];

export function stickyColorClass(color: string) {
  const known = STICKY_COLORS.some(option => option.value === color);
  return `sticky-note sticky-${known ? color : 'yellow'}`;
}
