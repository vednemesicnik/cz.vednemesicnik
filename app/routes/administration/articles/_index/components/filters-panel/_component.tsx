import { useCallback, useId, useRef, useState } from 'react'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import {
  type OwnFilter,
  RenameFilterDialog,
  SaveFilterDialog,
  type SharedFilter,
  useDeleteFilterConfirmation,
} from '~/components/admin/admin-saved-filters'
import { AdminTableFilters } from '~/components/admin/admin-table-filters'
import { Button } from '~/components/button'

import { FilterSelect } from '../filter-select'
import { SavedFiltersSection } from '../saved-filters-section'
import styles from './_styles.module.css'

type Option = {
  value: string
  label: string
}

type Props = {
  activeFilterId: string | null
  authorOptions: Option[]
  categoryOptions: Option[]
  currentQuery: string
  filters: {
    author?: string
    category?: string
    tag?: string
  }
  ownFilters: OwnFilter[]
  preservedParams: [string, string][]
  sharedFilters: SharedFilter[]
  summary: string
  tagOptions: Option[]
}

/**
 * Filtry and its panel (design 22d): Rubrika, Štítek and Autor, which apply at
 * once, and the saved filters. The button counts the active filters other than
 * the queue and the search.
 *
 * @param props.preservedParams - What a filter change keeps: the queue, the
 *   search and the sort.
 * @param props.summary - What a save keeps, for the save dialog.
 */
export const FiltersPanel = ({
  activeFilterId,
  authorOptions,
  categoryOptions,
  currentQuery,
  filters,
  ownFilters,
  preservedParams,
  sharedFilters,
  summary,
  tagOptions,
}: Props) => {
  const panelRef = useRef<HTMLDivElement>(null)
  // useId() contains colons, which are invalid in an id/anchor context.
  const panelId = `filters-panel-${useId().replace(/:/g, '')}`
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null)

  // The form dialogs live only while they are open, so every visit starts from
  // a clean form instead of the previous submission's values.
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<OwnFilter | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OwnFilter | null>(null)
  const { openDialog: openDeleteDialog } =
    useDeleteFilterConfirmation(deleteDialogRef)

  const filterCount = [filters.category, filters.tag, filters.author].filter(
    (value) => value !== undefined,
  ).length

  // A modal opens above the panel in the top layer; left open behind it, the
  // panel would only be dismissed by the first click inside the modal.
  const closePanel = () => panelRef.current?.hidePopover?.()

  const handleSave = () => {
    closePanel()
    setIsSaveDialogOpen(true)
  }

  const handleRename = (filter: OwnFilter) => {
    closePanel()
    setRenameTarget(filter)
  }

  const handleDelete = (filter: OwnFilter) => {
    closePanel()
    setDeleteTarget(filter)
    openDeleteDialog(filter.id)
  }

  // Stable: the dialogs subscribe to them for the native `close` event.
  const handleSaveDialogClose = useCallback(
    () => setIsSaveDialogOpen(false),
    [],
  )
  const handleRenameDialogClose = useCallback(() => setRenameTarget(null), [])

  return (
    <div className={styles.filtersPanel}>
      <Button
        popoverTarget={panelId}
        size={'sm'}
        type={'button'}
        variant={'outline'}
      >
        Filtry
        {filterCount > 0 && <span className={styles.count}>{filterCount}</span>}
      </Button>

      {/* Native popover: the trigger (its popovertarget invoker) becomes the
          implicit anchor, so the panel is positioned in CSS. */}
      <div
        className={styles.panel}
        id={panelId}
        popover={'auto'}
        ref={panelRef}
      >
        <AdminTableFilters
          className={styles.form}
          preservedParams={preservedParams}
        >
          <FilterSelect
            defaultValue={filters.category ?? ''}
            emptyLabel={'Všechny'}
            label={'Rubrika'}
            name={'category'}
            options={categoryOptions}
          />
          <FilterSelect
            defaultValue={filters.tag ?? ''}
            emptyLabel={'Všechny'}
            label={'Štítek'}
            name={'tag'}
            options={tagOptions}
          />
          <FilterSelect
            defaultValue={filters.author ?? ''}
            emptyLabel={'Všichni'}
            label={'Autor'}
            name={'author'}
            options={authorOptions}
          />
        </AdminTableFilters>

        {/* A sibling of the filter form, never a child: forms cannot nest. */}
        <SavedFiltersSection
          activeFilterId={activeFilterId}
          currentQuery={currentQuery}
          onDelete={handleDelete}
          onRename={handleRename}
          onSave={handleSave}
          ownFilters={ownFilters}
          sharedFilters={sharedFilters}
        />
      </div>

      {/* Outside the popover: a closed popover is `display: none`, which would
          take a nested dialog down with it. */}
      {isSaveDialogOpen && (
        <SaveFilterDialog
          currentQuery={currentQuery}
          defaultHint={
            'Použije se při otevření seznamu článků, pokud odkaz neobsahuje vlastní nastavení.'
          }
          onClose={handleSaveDialogClose}
          sharedHint={'Ostatní ho mohou použít, měnit ho můžete jen vy.'}
          summary={summary}
          tableKey={'articles'}
          title={'Uložit filtry'}
        />
      )}
      {renameTarget !== null && (
        <RenameFilterDialog
          filter={renameTarget}
          onClose={handleRenameDialogClose}
        />
      )}
      {/* Stays mounted: its hook attaches the `close` listener that submits. */}
      <AdminDeleteConfirmationDialog
        description={
          deleteTarget?.isShared
            ? 'Smazání je nevratné. Filtr zmizí i ostatním.'
            : 'Smazání je nevratné.'
        }
        ref={deleteDialogRef}
        title={`Smazat filtr „${deleteTarget?.name ?? ''}“?`}
      />
    </div>
  )
}
