/**
 * A file field's first control (design 26c, 27e): *Nahradit* or *Vyměnit*,
 * the drop field's input, or *Zkusit znovu*.
 *
 * @param container - The file's column, holding the row and its controls.
 * @returns The control, or `null` when the column has none.
 */
export const getFirstFileControl = (container: HTMLElement) =>
  container.querySelector<HTMLElement>(
    'button, input[type="file"]:not([hidden])',
  )
