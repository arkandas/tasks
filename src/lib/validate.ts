export const LIMITS = {
  title: 200,
  description: 5000,
  comment: 2000,
  stickyNote: 2000,
  username: 50,
  email: 254,
  passwordMin: 6,
  passwordMax: 200,
} as const

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export type PriorityValue = (typeof PRIORITIES)[number]

const STICKY_NOTE_COLORS = [
  'yellow',
  'blue',
  'green',
  'pink',
  'orange',
  'purple',
  'cyan',
  'red',
  'lime',
] as const
export type StickyNoteColorValue = (typeof STICKY_NOTE_COLORS)[number]

const USER_ROLES = ['ADMIN', 'USER'] as const
export type UserRoleValue = (typeof USER_ROLES)[number]

export function parseId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
  return Number.isInteger(id) && id > 0 ? id : null
}

export function parseIndex(value: unknown): number | null {
  const index = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
  return Number.isInteger(index) && index >= 0 ? index : null
}

export function requiredText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length > 0 && text.length <= max ? text : null
}

export function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string' || value.length > max) return undefined
  return value.trim() === '' ? null : value
}

export function isValidOptionalText(value: unknown, max: number): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.length <= max)
}

export function isPriority(value: unknown): value is PriorityValue {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value)
}

export function isStickyNoteColor(value: unknown): value is StickyNoteColorValue {
  return typeof value === 'string' && (STICKY_NOTE_COLORS as readonly string[]).includes(value)
}

export function isUserRole(value: unknown): value is UserRoleValue {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value)
}

export function parseOptionalDate(value: unknown): Date | null | undefined | 'invalid' {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') return 'invalid'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'invalid' : date
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item)
  return next
}
