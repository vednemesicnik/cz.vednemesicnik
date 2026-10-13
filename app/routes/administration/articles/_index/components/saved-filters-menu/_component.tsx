import { useCallback, useEffect, useRef, useState } from 'react'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import {
  type OwnFilter,
  RenameFilterDialog,
  SaveFilterDialog,
  type SharedFilter,
  useDeleteFilterConfirmation,
} from '~/components/admin/admin-saved-filters'

import { SavedFiltersSection } from '../saved-filters-section'
import { SavedFiltersTrigger } from '../saved-filters-trigger'
import styles from './_styles.module.css'

type Props = {
  menuId: string
  currentQuery: string
  matchingFilterId: string | null
  matchingFilterName: string | undefined
  ownFilters: OwnFilter[]
  sharedFilters: SharedFilter[]
  summaryLines: string[]
  triggerClassName?: string
}

/**
 * Uložené filtry at the end of the filter row (design 22d): own filters with
 * „⋯“, shared ones from others, and Uložit filtry…. Its button sits here; a
 * second `SavedFiltersTrigger` with the same `menuId` may open the menu from
 * elsewhere (22g).
 *
 * @param props.menuId - The id of the menu's popover, shared by its buttons.
 * @param props.currentQuery - The snapshot a save or an overwrite stores; `''`
 *   when nothing differs from the default.
 * @param props.summaryLines - What a save keeps, one filter per line.
 */
export const SavedFiltersMenu = ({
  menuId,
  currentQuery,
  matchingFilterId,
  matchingFilterName,
  ownFilters,
  sharedFilters,
  summaryLines,
  triggerClassName,
}: Props) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null)

  // The form dialogs live only while they are open, so every visit starts from
  // a clean form instead of the previous submission's values.
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<OwnFilter | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<OwnFilter | null>(null)
  const { openDialog: openDeleteDialog } =
    useDeleteFilterConfirmation(deleteDialogRef)

  // A modal opens above the menu in the top layer; left open behind it, the
  // menu would only be dismissed by the first click inside the modal.
  const closeMenu = () => menuRef.current?.hidePopover?.()

  // The menu's items are gone once it closes; the focus goes back to the
  // button on screen (k9vl0m53), of the two the one not hidden.
  const focusTrigger = useCallback(() => {
    const triggers = document.querySelectorAll<HTMLButtonElement>(
      `[popovertarget="${menuId}"]`,
    )

    ;[...triggers].find((trigger) => trigger.checkVisibility())?.focus()
  }, [menuId])

  const handleApply = () => {
    closeMenu()
    focusTrigger()
  }

  const handleSave = () => {
    closeMenu()
    setIsSaveDialogOpen(true)
  }

  const handleRename = (filter: OwnFilter) => {
    closeMenu()
    setRenameTarget(filter)
  }

  const handleDelete = (filter: OwnFilter) => {
    closeMenu()
    setDeleteTarget(filter)
    openDeleteDialog(filter.id)
  }

  // Stable: the dialogs subscribe to them for the native `close` event.
  const handleSaveDialogClose = useCallback(() => {
    setIsSaveDialogOpen(false)
    focusTrigger()
  }, [focusTrigger])
  const handleRenameDialogClose = useCallback(() => {
    setRenameTarget(null)
    focusTrigger()
  }, [focusTrigger])

  // Esc closes an open „⋯“ first, the browser's own way; then the menu, with
  // the focus back on its button (k9vl0m53), which Safari would not restore.
  useEffect(() => {
    const menu = menuRef.current

    if (menu === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element

      if (event.key !== 'Escape' || target.closest(':popover-open') !== menu) {
        return
      }

      event.preventDefault()
      menu.hidePopover?.()
      focusTrigger()
    }

    menu.addEventListener('keydown', handleKeyDown)

    return () => menu.removeEventListener('keydown', handleKeyDown)
  }, [focusTrigger])

  useEffect(() => {
    const dialog = deleteDialogRef.current

    if (dialog === null) return

    dialog.addEventListener('close', focusTrigger)

    return () => dialog.removeEventListener('close', focusTrigger)
  }, [focusTrigger])

  return (
    <div className={styles.savedFiltersMenu}>
      <SavedFiltersTrigger
        className={triggerClassName}
        matchingFilterName={matchingFilterName}
        menuId={menuId}
      />

      {/* Native popover: the trigger (its popovertarget invoker) becomes the
          implicit anchor, so the menu is positioned in CSS. */}
      <div className={styles.menu} id={menuId} popover={'auto'} ref={menuRef}>
        <SavedFiltersSection
          activeFilterId={matchingFilterId}
          currentQuery={currentQuery}
          // A saved filter is a whole choice: the menu goes with it, so the
          // list it switched to is in view.
          onApply={handleApply}
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
            'Použije se při otevření seznamu článků, pokud odkaz neobsahuje vlastní filtry.'
          }
          onClose={handleSaveDialogClose}
          sharedHint={'Ostatní ho mohou použít, měnit ho můžete jen vy.'}
          summary={
            <>
              <p className={styles.summaryIntro}>Uloží se:</p>
              <ul className={styles.summaryList}>
                {summaryLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </>
          }
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
