const normalizeName = (name: string) => name.trim().toLocaleLowerCase('cs')

/**
 * Whether a name is already taken, ignoring letter case (design 25c, s9fjeojo):
 * Maturita and maturita are the same name. Compared in JavaScript, because
 * SQLite's `lower()` folds ASCII only and Škola would pass beside škola.
 *
 * @param name - The name being saved.
 * @param takenNames - The names of the other records.
 */
export const isNameTaken = (name: string, takenNames: readonly string[]) => {
  const normalizedName = normalizeName(name)

  return takenNames.some(
    (takenName) => normalizeName(takenName) === normalizedName,
  )
}
