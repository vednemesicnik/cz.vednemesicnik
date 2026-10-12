import { useId } from 'react'
import { Link } from 'react-router'

import type {
  OwnFilter,
  SharedFilter,
} from '~/components/admin/admin-saved-filters'
import { Button } from '~/components/button'
import { FILTER_PRESET_PARAM } from '~/utils/admin-list-filters'

import { OwnFilterRow } from '../own-filter-row'
import styles from './_styles.module.css'

type Props = {
  activeFilterId: string | null
  currentQuery: string
  ownFilters: OwnFilter[]
  sharedFilters: SharedFilter[]
  onDelete: (filter: OwnFilter) => void
  onRename: (filter: OwnFilter) => void
  onSave: () => void
}

/**
 * The saved filters in the Filtry panel (design 22d): own ones with „⋯“,
 * shared ones from others to apply, and Uložit filtry…. The dialogs belong to
 * the caller, outside the panel.
 *
 * @param props.currentQuery - The snapshot a save or an overwrite stores; `''`
 *   when there is nothing to save.
 */
export const SavedFiltersSection = ({
  activeFilterId,
  currentQuery,
  ownFilters,
  sharedFilters,
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
              <li key={filter.id}>
                <Link
                  className={styles.apply}
                  data-active={filter.id === activeFilterId || undefined}
                  to={`?${filter.query}&${FILTER_PRESET_PARAM}=${filter.id}`}
                >
                  <span className={styles.name}>{filter.name}</span>
                  {/* Names are unique per user only, so the owner is what
                      tells two identically named filters apart. */}
                  <span className={styles.owner}>{filter.ownerName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.footer}>
        <Button
          aria-describedby={saveNoteId}
          disabled={!hasCurrentQuery}
          onClick={onSave}
          size={'sm'}
          type={'button'}
          variant={'outline'}
        >
          Uložit filtry…
        </Button>
        <p className={styles.note} id={saveNoteId}>
          {hasCurrentQuery
            ? 'Uloží se i hledání a volba nad seznamem článků.'
            : 'Není co uložit. Místo „Vše“ vyberte jinou možnost, něco vyhledejte nebo nastavte filtr.'}
        </p>
      </div>
    </div>
  )
}
