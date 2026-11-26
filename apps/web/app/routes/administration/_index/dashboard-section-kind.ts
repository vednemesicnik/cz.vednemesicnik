/** The dashboard's sections that hold rows (design 21a, 21b). */
export type DashboardSectionKind = 'queue' | 'drafts' | 'submitted'

/**
 * The action each section puts on its rows (21a, 21b): Schválit in the queue,
 * Upravit on one's own drafts, none in *Odeslané*, where everything is in „⋯“.
 */
export const SECTION_ROW_ACTION: Record<DashboardSectionKind, string | null> = {
  drafts: 'edit',
  queue: 'approve',
  submitted: null,
}
