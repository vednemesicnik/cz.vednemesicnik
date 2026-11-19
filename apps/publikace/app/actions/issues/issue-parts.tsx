import type { Handle } from 'remix/component'

import {
  type Issue,
  type IssueFilter,
  issueFilterSearch,
  type IssueState,
  STATE_LABELS,
} from '../../domain/issue.ts'
import { routes } from '../../routes.ts'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
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
