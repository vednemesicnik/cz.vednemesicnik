/**
 * What of the issue's details did not save (design 24h, 24i; copy ey73zhul),
 * by the fields' labels.
 *
 * @param labels - The labels of the fields that differ from the last save, in
 *   the form's order.
 * @returns „Neuložené změny: Název, Doplněk.“
 */
export const formatUnsavedIssueFields = (labels: readonly string[]) =>
  `Neuložené změny: ${labels.join(', ')}.`
