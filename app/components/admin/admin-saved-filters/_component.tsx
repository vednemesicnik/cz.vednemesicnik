import { clsx } from 'clsx'
import { useCallback, useId, useRef, useState } from 'react'
import { Link } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import {
  type AdminListTableKey,
  FILTER_PRESET_NONE,
  FILTER_PRESET_PARAM,
} from '~/utils/admin-list-filters'

import { useDeleteFilterConfirmation } from './_hook'
import styles from './_styles.module.css'
import type { OwnFilter, SharedFilter } from './_types'
import { PresetRow } from './components/preset-row'
import { RenameFilterDialog } from './components/rename-filter-dialog'
import { SaveFilterDialog } from './components/save-filter-dialog'

type Props = {
  activeFilterId: string | null
  currentQuery: string
  ownFilters: OwnFilter[]
  sharedFilters: SharedFilter[]
  tableKey: AdminListTableKey
}

export const AdminSavedFilters = ({
  activeFilterId,
  currentQuery,
  ownFilters,
  sharedFilters,
  tableKey,
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null)
  // useId() contains colons, which are invalid in an id/anchor context.
  const menuId = `admin-saved-filters-menu-${useId().replace(/:/g, '')}`

  const deleteDialogRef = useRef<HTMLDialogElement | null>(null)

  // The form dialogs live only while they are open, so every visit starts from a
  // clean form instead of the previous submission's values.
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<OwnFilter | null>(null)
  const { openDialog: openDeleteDialog } =
    useDeleteFilterConfirmation(deleteDialogRef)

  // A modal opens above the menu in the top layer; leaving the menu open behind
  // it would only be dismissed by the first click inside the modal.
  const closeMenu = () => menuRef.current?.hidePopover?.()

  const handleSave = () => {
    closeMenu()
    setIsSaveDialogOpen(true)
  }

  const handleRename = (filter: OwnFilter) => {
    closeMenu()
    setRenameTarget(filter)
  }

  // Stable: the dialogs subscribe to them for the native `close` event.
  const handleSaveDialogClose = useCallback(
    () => setIsSaveDialogOpen(false),
    [],
  )
  const handleRenameDialogClose = useCallback(() => setRenameTarget(null), [])

  const handleDelete = (filterId: string) => {
    closeMenu()
    openDeleteDialog(filterId)
  }

  const hasCurrentQuery = currentQuery !== ''

  return (
    <div className={styles.savedFilters}>
      <AdminButton popoverTarget={menuId} type={'button'} variant={'secondary'}>
        Uložené filtry
      </AdminButton>

      {/*
        Native popover: the trigger (its popovertarget invoker) becomes the
        implicit anchor, so the menu is positioned in CSS with anchor
        positioning. Modelled as a list of links and buttons, not an ARIA menu.
      */}
      <div className={styles.menu} id={menuId} popover={'auto'} ref={menuRef}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Moje filtry</h3>
          {ownFilters.length === 0 ? (
            <p className={styles.empty}>Zatím nemáte uložený žádný filtr.</p>
          ) : (
            <ul className={styles.list}>
              {ownFilters.map((filter) => (
                <PresetRow
                  currentQuery={currentQuery}
                  filter={filter}
                  isActive={filter.id === activeFilterId}
                  key={filter.id}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </ul>
          )}
        </section>

        {sharedFilters.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Sdílené filtry</h3>
            <ul className={styles.list}>
              {sharedFilters.map((filter) => (
                <li className={styles.sharedRow} key={filter.id}>
                  <Link
                    className={clsx(
                      styles.apply,
                      filter.id === activeFilterId && styles.applyActive,
                    )}
                    to={`?${filter.query}&${FILTER_PRESET_PARAM}=${filter.id}`}
                  >
                    <span className={styles.name}>{filter.name}</span>
                    {/* Names are unique per user only, so the owner is what
                        tells two identically named presets apart. */}
                    <span className={styles.owner}>{filter.ownerName}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className={styles.footer}>
          <Link
            className={styles.reset}
            to={`?${FILTER_PRESET_PARAM}=${FILTER_PRESET_NONE}`}
          >
            Zrušit filtry
          </Link>
          <AdminButton
            disabled={!hasCurrentQuery}
            onClick={handleSave}
            title={
              hasCurrentQuery
                ? undefined
                : 'Nejprve nastavte alespoň jeden filtr'
            }
            type={'button'}
          >
            Uložit aktuální filtr
          </AdminButton>
        </div>
      </div>

      {/* Outside the popover: a closed popover is `display: none`, which would
          take a nested dialog down with it. */}
      {isSaveDialogOpen && (
        <SaveFilterDialog
          currentQuery={currentQuery}
          onClose={handleSaveDialogClose}
          tableKey={tableKey}
        />
      )}
      {renameTarget !== null && (
        <RenameFilterDialog
          filter={renameTarget}
          onClose={handleRenameDialogClose}
        />
      )}
      {/* Stays mounted: its hook attaches the `close` listener that submits. */}
      <AdminDeleteConfirmationDialog ref={deleteDialogRef} />
    </div>
  )
}
