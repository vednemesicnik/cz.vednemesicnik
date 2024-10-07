export function slugify(value: string) {
  return value
    .toLowerCase() // Convert to lowercase
    .normalize("NFD") // Normalize the string
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove special characters except hyphens
}
