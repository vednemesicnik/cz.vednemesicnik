import type { Handle } from 'remix/component'

import {
  CLOSE_ANYWAY_LABEL,
  CLOSE_CONFIRM_LABEL,
  CLOSE_DIALOG_NOTE,
  CLOSE_DIALOG_TEXT,
  closeDialogTitle,
  type Issue,
  type IssueFilter,
  issueFilterSearch,
  type IssueState,
  REOPEN_CONFIRM_LABEL,
  REOPEN_DIALOG_TEXT,
  reopenDialogTitle,
  STATE_LABELS,
} from '../../domain/issue.ts'
import { routes } from '../../routes.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { Dialog } from '../../ui/dialog/component.tsx'
import { DialogTitle } from '../../ui/dialog-title/component.tsx'
import { PendingActions } from '../../ui/public/pending-actions/component.tsx'
import { StatusTag, type StatusTone } from '../../ui/status-tag/component.tsx'

/** `01c`: pink waits for you, blue is in motion, grey is out of play. */
const STATE_TONES: Record<IssueState, StatusTone> = {
  active: 'running',
  closed: 'neutral',
  unfinished: 'problem',
}

export function IssueStateTag(handle: Handle<{ state: IssueState }>) {
  return () => (
    <StatusTag tone={STATE_TONES[handle.props.state]}>{STATE_LABELS[handle.props.state]}</StatusTag>
  )
}

export type ReturnTo = 'detail' | 'overview'

/**
 * Where the button stands: the dialog's action row with _Zavřít_ (`11d`), the Callout of the
 * detail (`12i`), or a row of the overview and the line under it on a phone (`11d`, `11e`).
 */
export type FinishPlacement = 'callout' | 'dialog' | 'row'

const PLACEMENT_CLASSES: Record<FinishPlacement, string | undefined> = {
  callout: 'vdm-callout__actions',
  dialog: 'vdm-dialog__actions',
  row: undefined,
}

/**
 * _Dokončit vydání_ as a form of its own, wherever it stands. It acts at once, without a
 * question, because it takes nothing and creates nothing twice (`11d`, `12i`). `returnTo` says
 * which page the answer goes back to, and `filter` is the overview's, which an answer back to
 * the overview and _Zavřít_ in the dialog keep (`11a`); the detail has none to keep.
 */
export function FinishIssueForm(
  handle: Handle<{
    filter?: IssueFilter
    issue: Issue
    placement: FinishPlacement
    returnTo: ReturnTo
  }>,
) {
  return () => {
    let { filter = 'all', issue, placement, returnTo } = handle.props
    let isDialog = placement === 'dialog'

    return (
      <form
        action={routes.issues.finish.href({ name: issue.name })}
        class={PLACEMENT_CLASSES[placement]}
        method="post"
      >
        <CsrfField />
        <input name="returnTo" type="hidden" value={returnTo} />
        {returnTo === 'overview' && filter !== 'all' ? (
          <input name="state" type="hidden" value={filter} />
        ) : null}
        <PendingActions
          cancel={
            isDialog
              ? { href: `${routes.home.href()}${issueFilterSearch(filter)}`, label: 'Zavřít' }
              : undefined
          }
          emphasis={isDialog ? 'primary' : 'outline'}
          label="Dokončit vydání"
          pendingLabel="Vydání se dokončuje…"
        />
      </form>
    )
  }
}

/**
 * _Uzavřít vydání_ (`12g`) or _Znovu otevřít_ (`12h`), at its own address over the page it was
 * asked from, which the answer goes back to with the overview's filter kept (`11a`).
 */
export type IssueStepDialogView = {
  filter: IssueFilter
  issue: Issue
  kind: 'close' | 'reopen'
  returnTo: ReturnTo
  /** What still lacks consent, only when closing and only when something does. */
  warning: string | null
}

/** Where the answer and _Zrušit_ lead: the detail, or the overview with its filter. */
export function stepBackHref(issue: Issue, returnTo: ReturnTo, filter: IssueFilter): string {
  return returnTo === 'overview'
    ? `${routes.home.href()}${issueFilterSearch(filter)}`
    : routes.issues.show.href({ name: issue.name })
}

/** The address of the dialog, from the detail or from a row of the overview. */
export function stepDialogHref(
  kind: IssueStepDialogView['kind'],
  issue: Issue,
  returnTo: ReturnTo,
  filter: IssueFilter = 'all',
): string {
  let href = (kind === 'close' ? routes.issues.askClose : routes.issues.askReopen).href({
    name: issue.name,
  })
  if (returnTo === 'detail') return href
  let query = new URLSearchParams({ from: 'overview' })
  if (filter !== 'all') query.set('state', filter)
  return `${href}?${query}`
}

/*
 * Closing is red only in the dialog's button, because it takes the links and the jobs away;
 * reopening only gives them back, so its button is the plain primary one (`12g`, `12h`).
 */
export function IssueStepDialog(handle: Handle<{ step: IssueStepDialogView }>) {
  return () => {
    let { filter, issue, kind, returnTo, warning } = handle.props.step
    let isClosing = kind === 'close'
    let action = (isClosing ? routes.issues.close : routes.issues.reopen).href({
      name: issue.name,
    })

    return (
      <Dialog maxWidth={isClosing ? '480px' : '380px'}>
        <DialogTitle>
          {isClosing ? closeDialogTitle(issue.name) : reopenDialogTitle(issue.name)}
        </DialogTitle>
        <div class="vdm-dialog__body">
          {isClosing ? (
            <>
              <p class="vdm-dialog__text">{CLOSE_DIALOG_TEXT}</p>
              {warning === null ? null : (
                <Callout tone="warning">
                  <p style={{ margin: 0 }}>{warning}</p>
                </Callout>
              )}
              <p class="vdm-dialog__text">{CLOSE_DIALOG_NOTE}</p>
            </>
          ) : (
            <p class="vdm-dialog__text">{REOPEN_DIALOG_TEXT}</p>
          )}
        </div>
        <form action={action} class="vdm-dialog__actions" method="post">
          <CsrfField />
          <input name="returnTo" type="hidden" value={returnTo} />
          {returnTo === 'overview' && filter !== 'all' ? (
            <input name="state" type="hidden" value={filter} />
          ) : null}
          {/* Focus starts on the way back, so Enter on arrival changes nothing. */}
          <a
            autofocus
            class="vdm-btn vdm-btn--ghost vdm-btn--sm"
            href={stepBackHref(issue, returnTo, filter)}
          >
            Zrušit
          </a>
          <button
            class={`vdm-btn ${isClosing ? 'vdm-btn--danger' : 'vdm-btn--primary'} vdm-btn--sm`}
            type="submit"
          >
            {isClosing
              ? warning === null
                ? CLOSE_CONFIRM_LABEL
                : CLOSE_ANYWAY_LABEL
              : REOPEN_CONFIRM_LABEL}
          </button>
        </form>
      </Dialog>
    )
  }
}
