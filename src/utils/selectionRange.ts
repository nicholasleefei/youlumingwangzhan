export function selectionRange<T>(items: T[], from: T, to: T): T[] {
  const a = items.indexOf(from);
  const b = items.indexOf(to);
  if (a === -1 || b === -1) return [];
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return items.slice(lo, hi + 1);
}

