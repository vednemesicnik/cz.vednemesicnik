/**
 * Generates a username from a full name (e.g., "Jan Novák" → "jan.novak")
 * - Converts to lowercase
 * - Removes diacritics
 * - Replaces spaces with dots
 * - Removes special characters
 */
export function generateUsername(name: string): string {
  return name
    .toLowerCase() // Convert to lowercase
    .normalize("NFD") // Normalize the string by separating characters from diacritics
    .replace(/\p{M}/gu, "") // Remove all combining marks (diacritics) using Unicode property
    .replace(/\s+/g, ".") // Replace spaces with dots
    .replace(/[^a-z0-9.]/g, "") // Remove special characters except dots
    .replace(/^\.+|\.+$/g, "") // Remove leading/trailing dots
    .replace(/\.+/g, ".") // Collapse multiple consecutive dots into one
}
