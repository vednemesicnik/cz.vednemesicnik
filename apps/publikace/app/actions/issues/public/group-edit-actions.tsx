import type { Handle } from 'remix/component'
import { clientEntry, ref } from 'remix/component'

export type GroupEditActionsProps = {
  cancelHref: string
  /** The group's name as stored, which a typed name is compared with. */
  currentName: string
  /** The name in the field when the dialog was drawn, which picks the first label. */
  fieldName: string
  pendingLabel: string
  renameLabel: string
  saveLabel: string
}

/** As the app stores a name: a change of case or of the spaces inside renames, around it not. */
function isRename(current: string, typed: string): boolean {
  return typed.normalize('NFC').trim() !== current
}

/**
 * The action row of _Upravit skupinu_ (`12f`): _Uložit_ while the name is the group's own,
 * _Uložit a přejmenovat složku_ once it differs, switched while typing, so the editor knows before
 * the step whether it reaches Drive. The switch is not announced: the paragraph above the fields
 * says the same, and the button's name is its label.
 *
 * While its form is on its way, both controls are locked and the submit shows the spinner, as
 * `PendingActions` does. Without the browser runtime the label is the one the server drew from
 * the field, and the form is an ordinary form.
 */
export const GroupEditActions = clientEntry(
  import.meta.url,
  function GroupEditActions(handle: Handle<GroupEditActionsProps>) {
    let isPending = false
    let isRenaming: boolean | null = null

    handle.frame.addEventListener(
      'reloadComplete',
      () => {
        if (!isPending) return
        isPending = false
        handle.update()
      },
      { signal: handle.signal },
    )

    return () => {
      let { cancelHref, currentName, fieldName, pendingLabel, renameLabel, saveLabel } =
        handle.props
      let renames = isRenaming ?? isRename(currentName, fieldName)

      return (
        <>
          {isPending ? (
            <button class="vdm-btn vdm-btn--ghost vdm-btn--sm" disabled type="button">
              Zrušit
            </button>
          ) : (
            <a class="vdm-btn vdm-btn--ghost vdm-btn--sm" href={cancelHref}>
              Zrušit
            </a>
          )}
          <button
            class="vdm-btn vdm-btn--primary vdm-btn--sm"
            disabled={isPending}
            mix={ref((node, signal) => {
              let form = (node as HTMLButtonElement).form
              form?.addEventListener(
                'submit',
                () => {
                  isPending = true
                  handle.update()
                },
                { signal },
              )
              form?.addEventListener(
                'input',
                (event) => {
                  let field = event.target
                  if (!(field instanceof HTMLInputElement) || field.name !== 'name') return
                  let next = isRename(handle.props.currentName, field.value)
                  if (next === isRenaming) return
                  isRenaming = next
                  handle.update()
                },
                { signal },
              )
            })}
            type="submit"
          >
            {isPending ? (
              <>
                <span aria-hidden="true" class="vdm-spinner"></span>
                {pendingLabel}
              </>
            ) : renames ? (
              renameLabel
            ) : (
              saveLabel
            )}
          </button>
        </>
      )
    }
  },
)
