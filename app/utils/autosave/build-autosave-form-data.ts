/**
 * The form as one autosave sends it: every field, but no file a save already
 * stored and no empty file input (decision 0022).
 *
 * @param formData - The form's current fields.
 * @param savedFiles - The files earlier saves carried.
 * @returns A new `FormData`; the input is left as it is.
 */
export const buildAutosaveFormData = (
  formData: FormData,
  savedFiles: WeakSet<File>,
): FormData => {
  const payload = new FormData()

  for (const [name, value] of formData) {
    if (typeof value === 'string') {
      payload.append(name, value)
    } else if (value.size > 0 && !savedFiles.has(value)) {
      payload.append(name, value)
    }
  }

  return payload
}
