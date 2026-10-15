export function slugify(value: string): string {
  return value
    .toLowerCase() // Convert to lowercase
    .normalize('NFD') // Normalize the string by separating characters from diacritics
    .replace(/\p{M}/gu, '') // Remove all combining marks (diacritics) using Unicode property
    .replace(/[^a-z0-9]+/g, '-') // Turn every run of other characters into one hyphen ("2026/4" → "2026-4")
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}
