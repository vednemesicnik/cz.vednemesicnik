/**
 * Builds search params from form data, leaving out every value that is empty
 * or only whitespace, so a GET submit never puts `?q=&category=` in the URL.
 * Values that are kept are not rewritten.
 *
 * @param formData - The submitted form's data.
 * @returns The non-empty string entries, in their original order.
 */
export const buildNonEmptySearchParams = (
  formData: FormData,
): URLSearchParams => {
  const searchParams = new URLSearchParams()

  for (const [name, value] of formData.entries()) {
    if (typeof value === 'string' && value.trim() !== '') {
      searchParams.append(name, value)
    }
  }

  return searchParams
}
