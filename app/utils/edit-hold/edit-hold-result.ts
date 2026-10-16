// Types only, server-free, so the editor's hook can import them.

/** Who holds the content, for the takeover dialog (24g) and the read-only editor (24h). */
export type EditHolder = {
  name: string
  /** ISO 8601 */
  since: string
  /** ISO 8601: the content's last save, never a hold write. */
  lastSavedAt: string
}

/** The answer to a take, renewal, takeover or release of the edit hold. */
export type EditHoldResult =
  | { status: 'holding' }
  | { status: 'own-other-tab' }
  | { status: 'held-by-other'; holder: EditHolder }
  | { status: 'lost'; holder: EditHolder | null }
  /**
   * Saved since the editor loaded it, or no longer an editable draft (24i).
   * `holder` is whoever else holds it now; `isEditable` is false once it left
   * the draft or went for review, so reloading the editor would not help.
   */
  | { status: 'changed'; holder: EditHolder | null; isEditable: boolean }
  | { status: 'released' }
