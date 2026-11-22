import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import { disconnectedBanner } from '../../domain/drive-account.ts'
import {
  CREATE_UNAVAILABLE_TEXT,
  CREATE_UNAVAILABLE_TITLE,
  EMPTY_TEXT,
  EMPTY_TITLE,
  emptyFilterTitle,
  FILTER_LABELS,
  folderUrl,
  type Issue,
  type IssueFilter,
  isInFilter,
  issueFilterSearch,
  issueState,
  NAME_HINT,
  NEW_ISSUE_TEXT,
  notConnectedDialogMessage,
  otherFilterText,
  phoneRowLine,
  rowSubtitle,
  unfinishedText,
  unfinishedTitle,
  missingFolders,
} from '../../domain/issue.ts'
import { routes } from '../../routes.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { Dialog } from '../../ui/dialog/component.tsx'
import { DialogTitle } from '../../ui/dialog-title/component.tsx'
import { EmptyState } from '../../ui/empty-state/component.tsx'
import { EmptyStateText } from '../../ui/empty-state-text/component.tsx'
import { EmptyStateTitle } from '../../ui/empty-state-title/component.tsx'
import { Layout } from '../../ui/layout/component.tsx'
import { ListHeader } from '../../ui/list-header/component.tsx'
import { ListHeaderAction } from '../../ui/list-header-action/component.tsx'
import { ListHeaderTitle } from '../../ui/list-header-title/component.tsx'
import type { PanelPerson } from '../../ui/panel/component.tsx'
import { ActionMenu } from '../../ui/public/action-menu/component.tsx'
import { PendingActions } from '../../ui/public/pending-actions/component.tsx'
import { SelectedField } from '../../ui/public/selected-field/component.tsx'
import { StateFilter } from '../../ui/state-filter/component.tsx'
import { TableRow } from '../../ui/table-row/component.tsx'
import { TableRowTitle } from '../../ui/table-row-title/component.tsx'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { Document } from '../document.tsx'
import { FinishIssueForm, IssueStateTag } from './issue-parts.tsx'

export type DriveStatus = 'connected' | 'disconnected' | 'not-connected'

/**
 * The dialog _Nové vydání_ (`11d`) in the state the last answer left it: the form, with what was
 * typed and why it was refused, or the issue Drive stopped halfway.
 */
export type NewIssueDialog =
  | { fieldError?: string; isDriveUnavailable?: boolean; kind: 'form'; name: string }
  | { issue: Issue; kind: 'unfinished' }

export type OverviewPageProps = {
  /** Created articles by issue ID; an issue missing here has none. */
  articleCounts: ReadonlyMap<number, number>
  /** The sent artworks by issue ID. */
  artworkCounts: ReadonlyMap<number, number>
  dialog?: NewIssueDialog
  driveAccount: { expectedEmail: string; status: DriveStatus }
  filter: IssueFilter
  issues: readonly Issue[]
  person: PanelPerson
  toasts: readonly ToastMessage[]
  /** What waits on the editors by issue ID, the items of _Čeká na vás_ (`11a`, `01d`, `12j`). */
  waitingCounts: ReadonlyMap<number, number>
}

/* The drawing's tracks (`11a`): the title takes what is left, the actions hold `⋯`. */
const COLUMNS = 'minmax(180px, 3fr) 120px minmax(110px, 1fr) minmax(130px, 1fr) 110px 44px'

const PHONE = '@media (max-width: 767.98px)'

/* Both on wrappers: `css()` sits in a cascade layer and loses to a design-system class on the
   same element, `.vdm-table { display: flex }` among them. */
const desktopOnlyStyle = css({ [PHONE]: { display: 'none' } })
const phoneOnlyStyle = css({ display: 'none', [PHONE]: { display: 'block' } })

const quietStyle = css({ color: 'var(--text-tertiary)' })

/* Holds the hidden name of the actions column: an absolute `.vdm-sr-only` with no positioned
   ancestor escapes the table that scrolls sideways on a phone and widens the whole page. */
const actionHeaderStyle = css({ position: 'relative' })

/*
 * `11e`: a row is two lines, and the whole row leads to the detail. The name's link is
 * stretched over the row; _Dokončit vydání_ stands above it, so it stays its own target.
 */
const phoneRowStyle = css({
  borderBottom: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  padding: '14px 0',
  position: 'relative',
  '&:first-child': { borderTop: '1px solid var(--border)' },
})

const phoneHeadStyle = css({
  alignItems: 'center',
  display: 'flex',
  gap: '12px',
  justifyContent: 'space-between',
})

const phoneNameStyle = css({
  color: 'var(--text-primary)',
  fontWeight: 600,
  minWidth: 0,
  overflowWrap: 'anywhere',
  textDecoration: 'none',
  '&::after': { content: '""', inset: 0, position: 'absolute' },
})

const phoneLineStyle = css({ color: 'var(--text-secondary)', fontSize: '13px' })

const phoneActionStyle = css({ position: 'relative', zIndex: 1 })

const spanCountsStyle = css({ gridColumn: 'span 3', justifySelf: 'start' })

/* The form holds the body and the actions so that the field and the button are sent together,
   while the dialog's own gaps still fall between them. */
const dialogFormStyle = css({ display: 'contents' })

function filterHref(filter: IssueFilter): string {
  return `${routes.home.href()}?state=${filter}`
}

function issueHref(issue: Issue): string {
  return routes.issues.show.href({ name: issue.name })
}

function folderItems(issue: Issue) {
  let folderId = issue.folderIds.issue
  return folderId === null ? [] : [{ href: folderUrl(folderId), label: 'Otevřít složku na Disku' }]
}

/* What waits on the editors, in the ink of _Čeká na vás_ (`01d`). */
const waitingCountStyle = css({ color: 'var(--state-attention-text)', fontWeight: 600 })

/** One row of `11a`; the unfinished one carries _Dokončit vydání_ where the counts would be. */
function IssueRow(
  handle: Handle<{
    articles: number
    artworks: number
    filter: IssueFilter
    isLast: boolean
    issue: Issue
    waiting: number
  }>,
) {
  return () => {
    let { articles, artworks, filter, isLast, issue, waiting } = handle.props
    let state = issueState(issue)

    return (
      <TableRow columns={COLUMNS} isLast={isLast} isMuted={state === 'closed'}>
        <TableRowTitle href={issueHref(issue)} sub={rowSubtitle(issue)} title={issue.name} />
        <span role="cell">
          <IssueStateTag state={state} />
        </span>
        {state === 'unfinished' ? (
          <span aria-colspan={3} mix={spanCountsStyle} role="cell">
            <FinishIssueForm filter={filter} issue={issue} placement="row" returnTo="overview" />
          </span>
        ) : (
          <>
            <span class="vdm-num" role="cell">
              {articles}
            </span>
            <span class="vdm-num" role="cell">
              {artworks}
            </span>
            {/* What waits on the editors: the amber and pink tags and the missing folders (`01d`,
                `12j`). A closed issue shows none, whatever is left in it: the jobs no longer work
                on it (`11a`). */}
            {waiting === 0 || state === 'closed' ? (
              <span mix={quietStyle} role="cell">
                —
              </span>
            ) : (
              <span class="vdm-num" mix={waitingCountStyle} role="cell">
                {waiting}
              </span>
            )}
          </>
        )}
        <span role="cell">
          <ActionMenu items={folderItems(issue)} label={`Další akce ${issue.name}`} />
        </span>
      </TableRow>
    )
  }
}

function PhoneRow(
  handle: Handle<{ articles: number; artworks: number; filter: IssueFilter; issue: Issue }>,
) {
  return () => {
    let { articles, artworks, filter, issue } = handle.props
    let state = issueState(issue)

    return (
      <div mix={phoneRowStyle}>
        <div mix={phoneHeadStyle}>
          <a href={issueHref(issue)} mix={phoneNameStyle}>
            {issue.name}
          </a>
          <IssueStateTag state={state} />
        </div>
        <span mix={phoneLineStyle}>{phoneRowLine(issue, articles, artworks)}</span>
        {state === 'unfinished' ? (
          <div mix={phoneActionStyle}>
            <FinishIssueForm filter={filter} issue={issue} placement="row" returnTo="overview" />
          </div>
        ) : null}
      </div>
    )
  }
}

function IssueList(
  handle: Handle<{
    articleCounts: ReadonlyMap<number, number>
    artworkCounts: ReadonlyMap<number, number>
    filter: IssueFilter
    issues: readonly Issue[]
    waitingCounts: ReadonlyMap<number, number>
  }>,
) {
  return () => {
    let { articleCounts, artworkCounts, filter, issues, waitingCounts } = handle.props
    let shown = issues.filter((issue) => isInFilter(issueState(issue), filter))
    let counts: Record<IssueFilter, number> = {
      all: issues.length,
      closed: issues.filter((issue) => isInFilter(issueState(issue), 'closed')).length,
      open: issues.filter((issue) => isInFilter(issueState(issue), 'open')).length,
    }

    return (
      <>
        <div>
          <StateFilter
            label="Stav"
            items={(['all', 'open', 'closed'] as const).map((item) => ({
              count: counts[item],
              href: filterHref(item),
              isActive: item === filter,
              label: FILTER_LABELS[item],
            }))}
          />
        </div>
        {shown.length === 0 && filter !== 'all' ? (
          <EmptyState>
            <EmptyStateTitle>{emptyFilterTitle(filter)}</EmptyStateTitle>
            <EmptyStateText>{otherFilterText(counts.all)}</EmptyStateText>
            <a class="vdm-btn vdm-btn--outline vdm-btn--sm" href={filterHref('all')}>
              Zobrazit vše
            </a>
          </EmptyState>
        ) : (
          <>
            <div mix={desktopOnlyStyle}>
              <div aria-label="Vydání" class="vdm-table" role="table">
                <TableRow columns={COLUMNS} isHead>
                  <span role="columnheader">Vydání</span>
                  <span role="columnheader">Stav</span>
                  <span role="columnheader">Články</span>
                  <span role="columnheader">Obrazová díla</span>
                  <span role="columnheader">Čeká na vás</span>
                  <span mix={actionHeaderStyle} role="columnheader">
                    <span class="vdm-sr-only">Akce</span>
                  </span>
                </TableRow>
                {shown.map((issue, index) => (
                  <IssueRow
                    articles={articleCounts.get(issue.id) ?? 0}
                    artworks={artworkCounts.get(issue.id) ?? 0}
                    filter={filter}
                    isLast={index === shown.length - 1}
                    issue={issue}
                    waiting={waitingCounts.get(issue.id) ?? 0}
                  />
                ))}
              </div>
            </div>
            <div mix={phoneOnlyStyle}>
              {shown.map((issue) => (
                <PhoneRow
                  articles={articleCounts.get(issue.id) ?? 0}
                  artworks={artworkCounts.get(issue.id) ?? 0}
                  filter={filter}
                  issue={issue}
                />
              ))}
            </div>
          </>
        )}
      </>
    )
  }
}

/**
 * The Callout at the top of the dialog's body. While the account is not connected it stands
 * from the moment the dialog opens, so whoever fills in the name knows it will not go through
 * (`14g`); disconnected, it is the sentence of the banner, as an error (`14c`, `11c`).
 */
function DialogCallout(
  handle: Handle<{ driveAccount: OverviewPageProps['driveAccount']; isDriveUnavailable: boolean }>,
) {
  return () => {
    let { driveAccount, isDriveUnavailable } = handle.props

    if (driveAccount.status === 'not-connected') {
      return (
        <Callout tone="warning">
          <p style={{ margin: 0 }}>{notConnectedDialogMessage(driveAccount.expectedEmail)}</p>
        </Callout>
      )
    }
    if (driveAccount.status === 'disconnected') {
      return (
        <Callout tone="error">
          <p style={{ margin: 0 }}>{disconnectedBanner(driveAccount.expectedEmail)}</p>
        </Callout>
      )
    }
    if (isDriveUnavailable) {
      return (
        <Callout tone="error">
          <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
            {CREATE_UNAVAILABLE_TITLE}
          </p>
          <p style={{ margin: 0 }}>{CREATE_UNAVAILABLE_TEXT}</p>
        </Callout>
      )
    }
    return null
  }
}

/** `11d`, at `/issues/new` over the overview. */
function NewIssueDialogView(
  handle: Handle<{
    dialog: NewIssueDialog
    driveAccount: OverviewPageProps['driveAccount']
    filter: IssueFilter
  }>,
) {
  return () => {
    let { dialog, driveAccount, filter } = handle.props
    let search = issueFilterSearch(filter)

    if (dialog.kind === 'unfinished') {
      return (
        <Dialog maxWidth="460px">
          <DialogTitle>Nové vydání</DialogTitle>
          <div class="vdm-dialog__body">
            <Callout tone="error">
              <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                {unfinishedTitle(dialog.issue.name)}
              </p>
              <p style={{ margin: 0 }}>{unfinishedText(missingFolders(dialog.issue))}</p>
            </Callout>
          </div>
          <FinishIssueForm
            filter={filter}
            issue={dialog.issue}
            placement="dialog"
            returnTo="detail"
          />
        </Dialog>
      )
    }

    let error = dialog.fieldError
    return (
      <Dialog maxWidth="460px">
        <DialogTitle>Nové vydání</DialogTitle>
        <form
          action={`${routes.issues.create.href()}${search}`}
          method="post"
          mix={dialogFormStyle}
          noValidate
        >
          <CsrfField />
          <div class="vdm-dialog__body">
            <DialogCallout
              driveAccount={driveAccount}
              isDriveUnavailable={dialog.isDriveUnavailable === true}
            />
            <p class="vdm-dialog__text" style={{ margin: 0 }}>
              {NEW_ISSUE_TEXT}
            </p>
            <SelectedField
              error={error}
              hint={NAME_HINT}
              label="Název vydání"
              name="name"
              value={dialog.name}
            />
          </div>
          <div class="vdm-dialog__actions">
            <PendingActions
              cancel={{ href: `${routes.home.href()}${search}`, label: 'Zrušit' }}
              emphasis="primary"
              label="Vytvořit vydání"
              pendingLabel="Vydání se vytváří…"
            />
          </div>
        </form>
      </Dialog>
    )
  }
}

/**
 * `/`: the issues (`11a`), the first run and an empty filter (`11b`), the phone (`11e`), and the
 * dialog _Nové vydání_ over it at `/issues/new` (`11d`). A list of issues, not a board: an issue
 * is added four times a year, so there is no paging.
 */
export function OverviewPage(handle: Handle<OverviewPageProps>) {
  return () => {
    let {
      articleCounts,
      artworkCounts,
      dialog,
      driveAccount,
      filter,
      issues,
      person,
      toasts,
      waitingCounts,
    } = handle.props
    let newIssueHref = `${routes.issues.new.href()}${issueFilterSearch(filter)}`

    return (
      <Document title="Vydání">
        <Layout
          active="issues"
          driveAccount={driveAccount}
          isInert={dialog !== undefined}
          person={person}
          title="Vydání"
          toasts={toasts}
        >
          <ListHeader>
            <ListHeaderTitle>Vydání</ListHeaderTitle>
            <ListHeaderAction>
              <a class="vdm-btn vdm-btn--primary" href={newIssueHref}>
                Nové vydání
              </a>
            </ListHeaderAction>
          </ListHeader>
          {issues.length === 0 ? (
            <EmptyState>
              <EmptyStateTitle>{EMPTY_TITLE}</EmptyStateTitle>
              <EmptyStateText>{EMPTY_TEXT}</EmptyStateText>
              <a class="vdm-btn vdm-btn--outline vdm-btn--sm" href={newIssueHref}>
                Nové vydání
              </a>
            </EmptyState>
          ) : (
            <IssueList
              artworkCounts={artworkCounts}
              articleCounts={articleCounts}
              filter={filter}
              issues={issues}
              waitingCounts={waitingCounts}
            />
          )}
        </Layout>
        {dialog === undefined ? null : (
          <NewIssueDialogView dialog={dialog} driveAccount={driveAccount} filter={filter} />
        )}
      </Document>
    )
  }
}
