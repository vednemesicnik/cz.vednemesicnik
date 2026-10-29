type Options<Action extends string> = {
  /** The action the section's row offers: Schválit in the queue, Upravit on a draft. */
  preferred: string | null
  /** The row's actions as its list has them, the row action first. */
  actions: readonly Action[]
}

/**
 * A dashboard row's actions (design 21a, 21b, 07c, gl703egt): the section's
 * action on the row when the row's actions hold it, everything else in „⋯“.
 * Taken from the row, not the section: a record someone else edits has no
 * Schválit, so none is offered for the server to refuse.
 *
 * @returns The row action, or `null`, and the „⋯“ items in their order.
 */
export const getDashboardRowActions = <Action extends string>({
  preferred,
  actions,
}: Options<Action>) => {
  const row = actions.find((action) => action === preferred) ?? null

  return {
    menu: actions.filter((action) => action !== row),
    row,
  }
}
