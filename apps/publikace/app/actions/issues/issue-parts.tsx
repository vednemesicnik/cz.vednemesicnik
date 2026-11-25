import type { Handle } from 'remix/component'
import { css } from 'remix/component'

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
  issueState,
  REOPEN_CONFIRM_LABEL,
  REOPEN_DIALOG_TEXT,
  reopenDialogTitle,
  NAME_HINT,
  STATE_LABELS,
} from '../../domain/issue.ts'
import type { ActionMenuItem } from '../../ui/public/action-menu/component.tsx'
import {
  type CalloutPart,
  canRemove,
  canRename,
  type FixCallout,
  type IssueContents,
  REMOVE_ISSUE_LABEL,
  REMOVE_CONFIRM_LABEL,
  removeDialogText,
  removeDialogTitle,
  RENAME_CONFIRM_LABEL,
  RENAME_DIALOG_TITLE,
  RENAME_ISSUE_LABEL,
  RENAME_PENDING_LABEL,
  renameDialogText,
} from '../../domain/issue-fixes.ts'
import { routes } from '../../routes.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { Dialog } from '../../ui/dialog/component.tsx'
import { DialogTitle } from '../../ui/dialog-title/component.tsx'
import { NewTabMark } from '../../ui/new-tab-mark/component.tsx'
import { PendingActions } from '../../ui/public/pending-actions/component.tsx'
import { SelectedField } from '../../ui/public/selected-field/component.tsx'
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
 * _Uzavřít vydání_ (`12g`), _Znovu otevřít_ (`12h`), _Přejmenovat vydání_ (`12v`) or _Odebrat
 * vydání_ (`12w`), at its own address over the page it was asked from, which the answer goes back
 * to with the overview's filter kept (`11a`).
 */
export type IssueStepDialogView = {
  /** Why the last answer refused, in the dialog over the field or the text. */
  callout?: FixCallout
  /** Why the typed name was refused, under the field (`12v`). */
  fieldError?: string
  filter: IssueFilter
  /** Whether the deployment names a Registr, for the sentence about the record (`12v`, `12w`). */
  hasRegistry?: boolean
  issue: Issue
  kind: 'close' | 'remove' | 'rename' | 'reopen'
  /** The name in the field, as typed. */
  name?: string
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
  let route = {
    close: routes.issues.askClose,
    remove: routes.issues.askRemove,
    rename: routes.issues.askRename,
    reopen: routes.issues.askReopen,
  }[kind]
  let href = route.href({ name: issue.name })
  if (returnTo === 'detail') return href
  let query = new URLSearchParams({ from: 'overview' })
  if (filter !== 'all') query.set('state', filter)
  return `${href}?${query}`
}

/**
 * _Přejmenovat vydání…_ and _Odebrat vydání…_, each only where it can go through (`12u`): a rename
 * for an issue that is not closed, a removal for one with no article and no group.
 */
export function fixItems(
  issue: Issue,
  contents: IssueContents,
  returnTo: ReturnTo,
  filter: IssueFilter = 'all',
): ActionMenuItem[] {
  let items: ActionMenuItem[] = []
  if (canRename(issue)) {
    items.push({
      href: stepDialogHref('rename', issue, returnTo, filter),
      isSameTab: true,
      label: RENAME_ISSUE_LABEL,
    })
  }
  if (canRemove(contents)) {
    items.push({
      href: stepDialogHref('remove', issue, returnTo, filter),
      isSameTab: true,
      label: REMOVE_ISSUE_LABEL,
    })
  }
  return items
}

/** Groups of items with a line between every two that are not empty. */
export function withSeparators(groups: readonly (readonly ActionMenuItem[])[]): ActionMenuItem[] {
  let items: ActionMenuItem[] = []
  for (let group of groups) {
    if (group.length === 0) continue
    if (items.length > 0) items.push({ isSeparator: true })
    items.push(...group)
  }
  return items
}

/*
 * Closing is red only in the dialog's button, because it takes the links and the jobs away;
 * reopening only gives them back, so its button is the plain primary one (`12g`, `12h`).
 */
export function IssueStepDialog(handle: Handle<{ step: IssueStepDialogView }>) {
  return () => {
    let { step } = handle.props
    if (step.kind === 'rename') return <RenameIssueDialog step={step} />
    if (step.kind === 'remove') return <RemoveIssueDialog step={step} />
    let { filter, issue, kind, returnTo, warning } = step
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

function Parts(handle: Handle<{ parts: readonly CalloutPart[] }>) {
  return () => (
    <>
      {handle.props.parts.map((part) =>
        typeof part === 'string' ? (
          part
        ) : (
          <a class="vdm-link" href={part.href} rel="noopener" target="_blank">
            {part.text}
            <NewTabMark />
          </a>
        ),
      )}
    </>
  )
}

/** The step as the heading, a list of links when there are many, and what came of it. */
export function FixCalloutView(handle: Handle<{ callout: FixCallout }>) {
  return () => {
    let { list, text, title } = handle.props.callout
    return (
      <Callout tone="error">
        <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
          <Parts parts={title} />
        </p>
        {list === undefined ? null : (
          <ul class="vdm-callout__list" style={{ margin: '0 0 4px' }}>
            {list.map((item) => (
              <li>
                <Parts parts={[item]} />
              </li>
            ))}
          </ul>
        )}
        <p style={{ margin: 0 }}>
          <Parts parts={text} />
        </p>
      </Callout>
    )
  }
}

/** The fields every answer of `12v` and `12w` needs to find the issue and its way back. */
function StepFields(handle: Handle<{ step: IssueStepDialogView }>) {
  return () => {
    let { filter, issue, returnTo } = handle.props.step
    return (
      <>
        <CsrfField />
        <input name="id" type="hidden" value={String(issue.id)} />
        <input name="shownName" type="hidden" value={issue.name} />
        <input name="returnTo" type="hidden" value={returnTo} />
        {returnTo === 'overview' && filter !== 'all' ? (
          <input name="state" type="hidden" value={filter} />
        ) : null}
      </>
    )
  }
}

/* The form holds the body and the actions, so the field goes with the button while the dialog's
   own gaps still fall between them. */
const dialogFormStyle = css({ display: 'contents' })

/**
 * `12v`: the field and the rules of `11d`. The form carries the issue's ID and the name it
 * showed, so a rename meanwhile is told apart from a typo in the address (`15d`). The answer
 * takes seconds with thirty articles, so the buttons lock and the spinner turns, as in `11d`.
 */
function RenameIssueDialog(handle: Handle<{ step: IssueStepDialogView }>) {
  return () => {
    let { step } = handle.props
    let { callout, fieldError, filter, hasRegistry = false, issue, name, returnTo } = step
    let [first, second] = renameDialogText(issueState(issue), hasRegistry)
    return (
      <Dialog maxWidth="460px">
        <DialogTitle>{RENAME_DIALOG_TITLE}</DialogTitle>
        <form
          action={routes.issues.rename.href({ name: issue.name })}
          method="post"
          mix={dialogFormStyle}
          noValidate
        >
          <StepFields step={step} />
          <div class="vdm-dialog__body">
            {callout === undefined ? null : <FixCalloutView callout={callout} />}
            <p class="vdm-dialog__text">{first}</p>
            <p class="vdm-dialog__text">{second}</p>
            <SelectedField
              error={fieldError}
              hint={NAME_HINT}
              label="Název vydání"
              name="name"
              value={name ?? issue.name}
            />
          </div>
          <div class="vdm-dialog__actions">
            <PendingActions
              cancel={{ href: stepBackHref(issue, returnTo, filter), label: 'Zrušit' }}
              emphasis="primary"
              label={RENAME_CONFIRM_LABEL}
              pendingLabel={RENAME_PENDING_LABEL}
            />
          </div>
        </form>
      </Dialog>
    )
  }
}

/**
 * `12w`: red, with the name in the title, because from the overview the row is not in sight
 * under the dialog. Focus starts on the way back, as in `12g`.
 */
function RemoveIssueDialog(handle: Handle<{ step: IssueStepDialogView }>) {
  return () => {
    let { step } = handle.props
    let { callout, filter, hasRegistry = false, issue, returnTo } = step
    let paragraphs = removeDialogText(issueState(issue), hasRegistry, issue.missing.issue !== null)
    return (
      <Dialog maxWidth="480px">
        <DialogTitle>{removeDialogTitle(issue.name)}</DialogTitle>
        <div class="vdm-dialog__body">
          {callout === undefined ? null : <FixCalloutView callout={callout} />}
          {paragraphs.map((paragraph) => (
            <p class="vdm-dialog__text">{paragraph}</p>
          ))}
        </div>
        <form
          action={routes.issues.remove.href({ name: issue.name })}
          class="vdm-dialog__actions"
          method="post"
        >
          <StepFields step={step} />
          <a
            autofocus
            class="vdm-btn vdm-btn--ghost vdm-btn--sm"
            href={stepBackHref(issue, returnTo, filter)}
          >
            Zrušit
          </a>
          <button class="vdm-btn vdm-btn--danger vdm-btn--sm" type="submit">
            {REMOVE_CONFIRM_LABEL}
          </button>
        </form>
      </Dialog>
    )
  }
}
