import { useId } from 'react'
import { Button } from '~/components/button'
import { OwnFilterRow } from '~/components/own-filter-row'
import { SharedFilterRow } from '~/components/shared-filter-row'
import type { OwnFilter, SharedFilter } from '~/types/saved-filter'
import styles from './_styles.module.css'

type Props = {
  activeFilterId: string | null
  currentQuery: string
  ownFilters: OwnFilter[]
  sharedFilters: SharedFilter[]
  onApply: () => void
  onDelete: (filter: OwnFilter) => void
  onRename: (filter: OwnFilter) => void
  onSave: () => void
}

/**
 * The saved filters in the Uložené filtry menu (design 22d): own ones with
 * „⋯“, shared ones from others to apply, and Uložit filtry…. The dialogs
 * belong to the caller, outside the menu.
 *
 * @param props.currentQuery - The snapshot a save or an overwrite stores; `''`
 *   when there is nothing to save.
 * @param props.onApply - Called when a filter is applied, which finishes the
 *   choice.
 */
export const SavedFiltersSection = ({
  activeFilterId,
  currentQuery,
  ownFilters,
  sharedFilters,
  onApply,
  onDelete,
  onRename,
  onSave,
}: Props) => {
  // useId() contains colons, which are invalid in an id/anchor context.
  const saveNoteId = `save-filter-note-${useId().replace(/:/g, '')}`
  const hasCurrentQuery = currentQuery !== ''

  return (
    <div className={styles.savedFilters}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Moje filtry</h3>
        {ownFilters.length === 0 ? (
          <p className={styles.empty}>Zatím nemáte uložený žádný filtr.</p>
        ) : (
          <ul className={styles.list}>
            {ownFilters.map((filter) => (
              <OwnFilterRow
                currentQuery={currentQuery}
                filter={filter}
                isActive={filter.id === activeFilterId}
                key={filter.id}
                onApply={onApply}
                onDelete={onDelete}
                onRename={onRename}
              />
            ))}
          </ul>
        )}
      </section>

      {sharedFilters.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Sdílené od ostatních</h3>
          <ul className={styles.list}>
            {sharedFilters.map((filter) => (
              <SharedFilterRow
                filter={filter}
                isActive={filter.id === activeFilterId}
                key={filter.id}
                onApply={onApply}
              />
            ))}
          </ul>
        </section>
      )}

      <div className={styles.footer}>
        <Button
          aria-describedby={hasCurrentQuery ? undefined : saveNoteId}
          disabled={!hasCurrentQuery}
          onClick={onSave}
          size={'sm'}
          type={'button'}
          variant={'outline'}
        >
          Uložit filtry…
        </Button>
        {/* Only in the default, the one setting with nothing to save (22d). */}
        {!hasCurrentQuery && (
          <p className={styles.note} id={saveNoteId}>
            Nastavte alespoň jeden filtr.
          </p>
        )}
      </div>
    </div>
  )
}
