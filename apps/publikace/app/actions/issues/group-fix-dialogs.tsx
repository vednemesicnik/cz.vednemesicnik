import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import {
  CREATE_GROUP_LABEL,
  CREATE_GROUP_PENDING_LABEL,
  CREATE_GROUP_UNAVAILABLE_TEXT,
  CREATE_GROUP_UNAVAILABLE_TITLE,
  NEW_GROUP_DIALOG_TEXT,
  NEW_GROUP_DIALOG_TITLE,
} from '../../domain/artwork-group.ts'
import { disconnectedBanner } from '../../domain/drive-account.ts'
import {
  EDIT_GROUP_TEXT,
  EDIT_GROUP_TITLE,
  REMOVE_GROUP_CONFIRM_LABEL,
  SAVE_AND_RENAME_GROUP_LABEL,
  SAVE_GROUP_LABEL,
  SAVE_GROUP_PENDING_LABEL,
} from '../../domain/group-fixes.ts'
import { type IssueFilter, notConnectedDialogMessage } from '../../domain/issue.ts'
import type { FixCallout } from '../../domain/issue-fixes.ts'
import { REQUIRED_LEGEND } from '../../domain/public/article-form.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { Dialog } from '../../ui/dialog/component.tsx'
import { DialogTitle } from '../../ui/dialog-title/component.tsx'
import { PendingActions } from '../../ui/public/pending-actions/component.tsx'
import { GroupFields } from './group-fields.tsx'
import { FixCalloutView, type ReturnTo } from './issue-parts.tsx'
import type { DriveStatus } from './overview-page.tsx'
import { GroupEditActions } from './public/group-edit-actions.tsx'

/**
 * _Upravit skupinu_ (`12f`) over the detail: where it is sent and where _Zrušit_ leads, the fields
 * as typed with their messages, and the name and note the dialog showed, which the answer checks.
 */
export type EditGroupView = {
  action: string
  callout?: FixCallout
  cancelHref: string
  /** The group's name as stored, which the button compares the field with. */
  currentName: string
  errors: { name: string | null; note: string | null }
  shownName: string
  shownNote: string
  values: { name: string; note: string }
}

/** _Odebrat skupinu_ (`12f`) over the detail: its title, paragraphs, and a Callout once refused. */
export type RemoveGroupView = {
  action: string
  callout?: FixCallout
  cancelHref: string
  paragraphs: readonly string[]
  title: string
}

/**
 * The dialog _Nová skupina obrazových děl_ (`12e`), over the detail or, from a row's „⋯“, over the
 * overview and its filter (`11a`).
 */
export type NewGroupDialogView = {
  action: string
  cancelHref: string
  errors: { name: string | null; note: string | null }
  formKey: string
  /** The page under the dialog, which a refused answer is drawn over again. */
  from: { filter: IssueFilter; returnTo: ReturnTo }
  /** Drive did not answer, or the account is not connected: the fields stay as they were. */
  refusal: 'disconnected' | 'not-connected' | 'unavailable' | null
  values: { name: string; note: string }
}

export type GroupFixView =
  | ({ kind: 'edit' } & EditGroupView)
  | ({ kind: 'remove' } & RemoveGroupView)

/* The form holds the body and the actions, so the fields go with the buttons while the dialog's
   own gaps still fall between them. */
const dialogFormStyle = css({ display: 'contents' })

export function GroupFixDialog(handle: Handle<{ view: GroupFixView }>) {
  return () => {
    let { view } = handle.props
    return view.kind === 'edit' ? (
      <EditGroupDialog view={view} />
    ) : (
      <RemoveGroupDialog view={view} />
    )
  }
}

/**
 * `12f`: the Callout on top, where every fix has it (`12x`), then the two paragraphs that stand
 * the same in every state, so nothing moves while typing, then the fields of `12e`.
 */
function EditGroupDialog(handle: Handle<{ view: EditGroupView }>) {
  return () => {
    let { action, callout, cancelHref, currentName, errors, shownName, shownNote, values } =
      handle.props.view
    let [first, second] = EDIT_GROUP_TEXT
    return (
      <Dialog maxWidth="500px">
        <DialogTitle>{EDIT_GROUP_TITLE}</DialogTitle>
        <form action={action} method="post" mix={dialogFormStyle} noValidate>
          <CsrfField />
          <input name="shownName" type="hidden" value={shownName} />
          <input name="shownNote" type="hidden" value={shownNote} />
          <div class="vdm-dialog__body">
            {callout === undefined ? null : <FixCalloutView callout={callout} />}
            <p class="vdm-dialog__text">{first}</p>
            <p class="vdm-dialog__text">{second}</p>
            <p class="vdm-form__legend" style={{ margin: 0 }}>
              {REQUIRED_LEGEND}
            </p>
            <GroupFields errors={errors} values={values} />
          </div>
          <div class="vdm-dialog__actions">
            <GroupEditActions
              cancelHref={cancelHref}
              currentName={currentName}
              fieldName={values.name}
              pendingLabel={SAVE_GROUP_PENDING_LABEL}
              renameLabel={SAVE_AND_RENAME_GROUP_LABEL}
              saveLabel={SAVE_GROUP_LABEL}
            />
          </div>
        </form>
      </Dialog>
    )
  }
}

/**
 * `12f`: red only in the button, as `12z`, and the group named in the title in quotes. Focus
 * starts on the way back, so Enter on arrival never removes anything.
 */
function RemoveGroupDialog(handle: Handle<{ view: RemoveGroupView }>) {
  return () => {
    let { action, callout, cancelHref, paragraphs, title } = handle.props.view
    return (
      <Dialog maxWidth="480px">
        <DialogTitle>{title}</DialogTitle>
        <div class="vdm-dialog__body">
          {callout === undefined ? null : <FixCalloutView callout={callout} />}
          {paragraphs.map((paragraph) => (
            <p class="vdm-dialog__text">{paragraph}</p>
          ))}
        </div>
        <form action={action} class="vdm-dialog__actions" method="post">
          <CsrfField />
          <a autofocus class="vdm-btn vdm-btn--ghost vdm-btn--sm" href={cancelHref}>
            Zrušit
          </a>
          <button class="vdm-btn vdm-btn--danger vdm-btn--sm" type="submit">
            {REMOVE_GROUP_CONFIRM_LABEL}
          </button>
        </form>
      </Dialog>
    )
  }
}

/**
 * `12e`, at `/issues/{name}/artwork-groups/new`. A refused name or note comes back with the fields
 * as they were typed; so does a Drive that did not answer, with the step in a Callout above them,
 * as on _Nové vydání_ (`11c`). Asked from the overview, the form says so, as a step dialog's does,
 * and a refusal is drawn over the overview again.
 */
export function NewGroupDialog(
  handle: Handle<{
    dialog: NewGroupDialogView
    driveAccount: { expectedEmail: string; status: DriveStatus }
  }>,
) {
  return () => {
    let { dialog, driveAccount } = handle.props
    let { errors, from, refusal, values } = dialog
    return (
      <Dialog maxWidth="500px">
        <DialogTitle>{NEW_GROUP_DIALOG_TITLE}</DialogTitle>
        <form action={dialog.action} method="post" mix={dialogFormStyle} noValidate>
          <CsrfField />
          <input name="formKey" type="hidden" value={dialog.formKey} />
          <input name="returnTo" type="hidden" value={from.returnTo} />
          {from.returnTo === 'overview' && from.filter !== 'all' ? (
            <input name="state" type="hidden" value={from.filter} />
          ) : null}
          <div class="vdm-dialog__body">
            {refusal === 'not-connected' ? (
              <Callout tone="warning">
                <p style={{ margin: 0 }}>{notConnectedDialogMessage(driveAccount.expectedEmail)}</p>
              </Callout>
            ) : refusal === 'disconnected' ? (
              <Callout tone="error">
                <p style={{ margin: 0 }}>{disconnectedBanner(driveAccount.expectedEmail)}</p>
              </Callout>
            ) : refusal === 'unavailable' ? (
              <Callout tone="error">
                <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                  {CREATE_GROUP_UNAVAILABLE_TITLE}
                </p>
                <p style={{ margin: 0 }}>{CREATE_GROUP_UNAVAILABLE_TEXT}</p>
              </Callout>
            ) : null}
            <p class="vdm-dialog__text" style={{ margin: 0 }}>
              {NEW_GROUP_DIALOG_TEXT}
            </p>
            <p class="vdm-form__legend" style={{ margin: 0 }}>
              {REQUIRED_LEGEND}
            </p>
            <GroupFields errors={errors} values={values} />
          </div>
          <div class="vdm-dialog__actions">
            <PendingActions
              cancel={{ href: dialog.cancelHref, label: 'Zrušit' }}
              emphasis="primary"
              label={CREATE_GROUP_LABEL}
              pendingLabel={CREATE_GROUP_PENDING_LABEL}
            />
          </div>
        </form>
      </Dialog>
    )
  }
}
