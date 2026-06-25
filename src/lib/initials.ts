/** Safe avatar initials from any string (handles RTL, empty, emoji). */
export function getInitials(name?: string | null, fallback = '؟'): string {
  if (!name) return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return [...parts[0]][0] ?? fallback;
  return ([...parts[0]][0] ?? '') + ([...parts[parts.length - 1]][0] ?? '');
}
