export const createEditorContent = (value: string | undefined) => {
  try {
    return value !== undefined ? JSON.parse(value) : null
  } catch {
    return null
  }
}
