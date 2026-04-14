export function normalizeString(input?: string): string | undefined {
  if (input === undefined || input === null) return undefined;
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
