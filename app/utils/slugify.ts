export function slugify(value: string): string {
  return value
    .toLowerCase() // Convert to lowercase
    .normalize("NFD") // Normalize the string by separating characters from diacritics
    .replace(/\p{M}/gu, "") // Remove all combining marks (diacritics) using Unicode property
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove special characters except hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .replace(/-+/g, "-") // Collapse multiple consecutive hyphens into one
}
