function localDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDeadline(deadline: string) {
  return new Date(deadline).toLocaleDateString(undefined, { timeZone: 'UTC' });
}

export function isOverdue(deadline: string, now = new Date()) {
  return deadline.slice(0, 10) < localDay(now);
}
