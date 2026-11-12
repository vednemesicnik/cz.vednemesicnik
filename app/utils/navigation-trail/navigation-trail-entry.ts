/** A page of the tab's history: its entry key and its address. */
export type TrailEntry = {
  key: string
  pathname: string
  search: string
}

/**
 * What the app remembers of one history entry (design 30i, n3wa2ld4).
 *
 * - `trail`: the entries that led to it, the latest first.
 * - `returnKey`: on an entry reached by going back up to a list, the key of the
 *   entry it returned to, whose scroll position it takes.
 * - `focusPath`: on that entry, the address of the record it came back from,
 *   whose link in the list gets the focus.
 */
export type TrailRecord = {
  trail: TrailEntry[]
  returnKey?: string
  focusPath?: string
}

/** The navigation state of a link up that returns to a remembered list. */
export type ReturnState = { returnTo: string }
