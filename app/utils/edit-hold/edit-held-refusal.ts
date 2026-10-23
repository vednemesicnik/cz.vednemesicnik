// Types only, server-free, so a page can read a refused action's result.

/** Why a write on held content was refused (logs 0019, 0036). */
export type EditHeldRefusal = {
  heldByName: string
  /** The acting author's own editor, in another tab (a delete only, 0036). */
  isOwnOtherTab: boolean
}
