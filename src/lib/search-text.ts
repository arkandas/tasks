export function plainText(markdown: string) {
  return markdown
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[[ xX]\]/g, '')
    .replace(/^\s*(?:[-+*]|\d+\.|#{1,6}|>)\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function snippet(text: string | null, query: string) {
  if (!text) return null;
  const plain = plainText(text);
  const at = plain.toLowerCase().indexOf(query.toLowerCase());
  if (at === -1) return null;
  let from = Math.max(0, at - 24);
  if (from > 0) {
    const wordStart = plain.indexOf(' ', from) + 1;
    if (wordStart > 0 && wordStart <= at) from = wordStart;
  }
  return (from > 0 ? '…' : '') + plain.slice(from, at + query.length + 48);
}

export function firstLine(text: string) {
  return plainText(text.trim().split('\n')[0]) || 'Empty note';
}

export function escapeLikePattern(query: string) {
  return query.replace(/[\\%_]/g, '\\$&');
}
