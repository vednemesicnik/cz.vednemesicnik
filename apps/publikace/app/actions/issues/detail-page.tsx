import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'
import { getContext } from 'remix/middleware/async-context'
import { getCsrfToken } from 'remix/middleware/csrf'

import {
  ARTWORK_COLUMN,
  ARTWORK_FILTERS,
  ARTWORK_STATE_LABELS,
  type ArtworkFilter,
  type ArtworkState,
  ARTWORKS_SECTION_TITLE,
  artworkMenuLabel,
  AUTHOR_SOURCE_COLUMN,
  COPY_ARTWORKS_LINK_LABEL,
  discardLabel,
  OPEN_ARTWORK_LABEL,
  resendLabel,
  DISCARD_CANCEL_LABEL,
  DISCARD_CONFIRM_LABEL,
  DISCARD_DISCONNECTED_TITLE,
  DISCARD_PARTLY_BINNED_TEXT,
  DISCARD_UNAVAILABLE_TITLE,
  discardDialogText,
  discardDialogTitle,
  isWaiting,
  PROVIDER_COLUMN,
  STATE_COLUMN,
} from '../../domain/artwork.ts'
import {
  CHECK_AGAIN_LABEL,
  DISCARD_KEPT_TEXT,
  type HeadingPart,
  type SubfolderKind,
} from '../../domain/article-folders.ts'

import {
  ARTICLES_EMPTY_TEXT,
  ARTWORKS_EMPTY_TEXT,
  detailStartedLine,
  folderGoneMessage,
  folderUrl,
  type Issue,
  issueState,
  LINK_PLACEHOLDER_TEXT,
  missingFolders,
  unfinishedText,
  unfinishedTitle,
} from '../../domain/issue.ts'
import {
  ARTICLE_LINK_LABEL,
  LINK_SECTION_TEXT,
  LINK_SECTION_TITLE,
  OPEN_FORM_LABEL,
  RENEW_CONFIRM_LABEL,
  RENEW_LINK_LABEL,
  RENEW_DIALOG_NOTE,
  RENEW_DIALOG_TEXT,
  RENEW_DIALOG_TITLE,
  SHARE_LABEL,
} from '../../domain/link.ts'
import { routes } from '../../routes.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { Dialog } from '../../ui/dialog/component.tsx'
import { DialogTitle } from '../../ui/dialog-title/component.tsx'
import { EmptyState } from '../../ui/empty-state/component.tsx'
import { EmptyStateText } from '../../ui/empty-state-text/component.tsx'
import { Layout } from '../../ui/layout/component.tsx'
import type { PanelPerson } from '../../ui/panel/component.tsx'
import { ActionMenu, type ActionMenuItem } from '../../ui/public/action-menu/component.tsx'
import { CopyButton } from '../../ui/public/copy-button/component.tsx'
import { ShareButton } from '../../ui/public/share-button/component.tsx'
import { StateFilter } from '../../ui/state-filter/component.tsx'
import { StatusTag, type StatusTone } from '../../ui/status-tag/component.tsx'
import { TableRow } from '../../ui/table-row/component.tsx'
import { TableRowTitle } from '../../ui/table-row-title/component.tsx'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { Document } from '../document.tsx'
import { FinishIssueForm, IssueStateTag } from './issue-parts.tsx'
import type { DriveStatus } from './overview-page.tsx'
import { tied } from '../../domain/public/typography.ts'
import type { ArticleState } from '../../domain/article.ts'
import {
  CANCEL_HANDOVER_LABEL,
  HAND_OVER_LABEL,
  handOverButtonLabel,
  HANDING_OVER_LABEL,
} from '../../domain/handover.ts'
import { PendingActions } from '../../ui/public/pending-actions/component.tsx'
import { CANCEL_FINAL_LABEL, OPEN_PDF_LABEL } from '../../domain/proofreading-queue.ts'
import { SHOW_REPLY_LABEL } from '../../domain/approvals.ts'

/** The block _Odkaz pro redakci_ of an active issue (`12a`, `12c`, `02b`). */
export type LinkBlockView = {
  /** Highlighted with focus on _Kopírovat_ until the next load: a fresh or renewed link. */
  isChanged: boolean
  /** The form as the newsroom sees it, for _Otevřít formulář_. */
  openHref: string
  renewHref: string
  shareText: string
  shown: string
  url: string
  usage: string
}

/** The Callout under an article's row whose folder, or a folder in it, is missing (`12j`). */
export type MissingFoldersView = {
  /** Where _Zkontrolovat znovu_ posts. */
  checkAction: string
  /** The step, the subfolders' names in it linking to the very folder on Drive. */
  heading: readonly HeadingPart[]
  /** What the row cannot do and when the app found it, in one paragraph. */
  text: string
  urls: Readonly<Partial<Record<SubfolderKind, string>>>
}

/** One author's clause in the open row (`12b`): the tag, its line, and where the line leads. */
export type ClauseAuthorView = {
  email: string
  /** _Úloha …_ under _Chyba_ (`14e`), _Přejít na odpověď ke kontrole_ under a reply (`13a`). */
  link: { href: string; label: string } | null
  name: string
  /** The reply under _Ke kontrole_, read here and decided in the queue. */
  quote: string | null
  tag: { detail?: string; label: string; tone: StatusTone }
}

/** What opens under the row of an article with a final version (`12b`, `12q`). */
export type ClausesView = {
  authors: readonly ClauseAuthorView[]
  documentUrl: string
  /** _Finální verze z ‹čas› · Označení: ‹kdo›_. */
  markedLine: string
  names: readonly string[]
  /** _Jména v doložkách_, or _Jméno v doložce_ for one author. */
  namesLabel: string
  pdfUrl: string
  /** _Poslat žádost znovu_ while a clause waits on no reply or was not confirmed (`12b`). */
  resend: { action: string; label: string } | null
}

/** One row of _Články_ (`12a`), with what exists of an article so far. */
export type ArticleRowView = {
  /** The cell _Obrazová díla_: the sent artworks and what waits among them, `—` without any. */
  artworks: { count: number; line: { isWaiting: boolean; text: string } | null }
  /** The article's link for artworks, for the `⋯` copy item; `null` once it is revoked. */
  artworksUrl: string | null
  authors: string
  /** _Zrušit předání_ in `⋯`, only on _Dopsáno_ of an issue still open (`12k`). */
  cancelHandoverAction: string | null
  /** _Zrušit finální verzi_ in `⋯`, on _K souhlasu_ while no run has taken a clause (`12q`). */
  cancelFinalAction: string | null
  documentUrl: string
  /** _Předat ke korektuře_ in the row, only on _Píše se_ of an issue still open (`12k`). */
  handOverAction: string | null
  id: number
  missing: MissingFoldersView | null
  name: string
  /** _Otevřít PDF_ in `⋯`, for an article with a final version (`12q`). */
  pdfUrl: string | null
  /** Where the row stands among the others: a settled row by the state it had (`12l`). */
  sortAt: Temporal.Instant | null
  sortState: ArticleState
  /** The article's one tag and the fact under it (`01a`). */
  state: { detail: string; label: string; tone: StatusTone }
  /** The open row's band, only on the row the address opened. */
  clauses: ClausesView | null
  isOpen: boolean
  /** _Zobrazit odpověď_ in `⋯` of a row _Ke kontrole_ that is not open (`12a`). */
  showReplyHref: string | null
  /** Where the tag leads: open, or closed again when open; `null` without a final version. */
  stateHref: string | null
}

/** The warning over _Články_ while the proofreaders have no address (`12l`). */
export type MissingAddressView = {
  /** _Do Nastavení_, only for an administrator, who changes the address. */
  action?: { href: string; label: string }
  text: string
  title: string
}

/**
 * One row of _Obrazová díla_ (`12a`): an artwork of a batch, with the batch's state. The
 * batch's actions stand on each of its rows, and act on all of them (`12o`).
 */
export type ArtworkRowView = {
  articleName: string
  author: string
  /**
   * Resend and discard, for a batch in _Chyba_ of an issue still open; each `null` while a folder
   * it needs is missing (`12o`).
   */
  batchActions: { count: number; discardHref: string | null; resendAction: string | null } | null
  driveUrl: string
  id: number
  name: string
  providerEmail: string
  providerName: string
  source: { href: string; shown: string } | null
  state: ArtworkState
  stateDetail: string
}

export type ArtworksView = {
  counts: Readonly<Record<ArtworkFilter, number>>
  filter: ArtworkFilter
  hrefOf(filter: ArtworkFilter): string
  rows: readonly ArtworkRowView[]
}

/** The question _Zahodit dávku_ over the detail (`12o`). */
export type DiscardView = {
  action: string
  articleName: string
  cancelHref: string
  count: number
  email: string
  /** The confirm met a folder gone meanwhile: nothing went to the bin (`12o`). */
  folderGone?: { heading: readonly HeadingPart[]; urls: MissingFoldersView['urls'] }
  /**
   * The confirm did not go through (`12o`): Drive stopped, and the batch is whole again or
   * `partly-binned` when Drive would not take a file back; or the account is not connected.
   */
  refusal?: DiscardRefusal
}

export type DiscardRefusal = 'disconnected' | 'partly-binned' | 'unavailable'

/** Each refusal's step and the state under it, the shape of the missing folder's Callout. */
const DISCARD_REFUSALS: Record<DiscardRefusal, { text: string; title: string }> = {
  disconnected: { text: DISCARD_KEPT_TEXT, title: DISCARD_DISCONNECTED_TITLE },
  'partly-binned': { text: DISCARD_PARTLY_BINNED_TEXT, title: DISCARD_UNAVAILABLE_TITLE },
  unavailable: { text: DISCARD_KEPT_TEXT, title: DISCARD_UNAVAILABLE_TITLE },
}

export type DetailPageProps = {
  articles: readonly ArticleRowView[]
  missingAddress?: MissingAddressView
  artworks: ArtworksView
  discarding?: DiscardView
  driveAccount: { expectedEmail: string; status: DriveStatus }
  /** _Dokončit vydání_ found the stored issue folder gone, so it created nothing (`12i`). */
  isFolderGone?: boolean
  /** The question _Vydat nový odkaz_ over the detail (`02d`). */
  isRenewing?: boolean
  issue: Issue
  link?: LinkBlockView
  person: PanelPerson
  toasts: readonly ToastMessage[]
}

const pageStyle = css({ display: 'flex', flexDirection: 'column', gap: '28px' })

const headStyle = css({ display: 'flex', flexDirection: 'column', gap: '12px' })

const titleBarStyle = css({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  justifyContent: 'space-between',
})

const titleStyle = css({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  minWidth: 0,
  '& h1': { overflowWrap: 'anywhere' },
})

const metaStyle = css({ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 })

const sectionStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  '& h2': { fontSize: '16px', fontWeight: 600, margin: 0 },
})

const countStyle = css({ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '6px' })

const placeholderStyle = css({ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 })

const linkHeadStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  '& h2': { fontSize: '16px', fontWeight: 600, margin: 0 },
})

/* On a wrapper: `css()` sits in a cascade layer and loses to `.vdm-changed` on the same element. */
const linkBoxStyle = css({
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xl)',
  overflow: 'hidden',
})

const linkRowStyle = css({
  alignItems: 'flex-start',
  display: 'flex',
  gap: '12px',
  justifyContent: 'space-between',
  padding: '16px 20px',
})

const linkBodyStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  minWidth: 0,
  /* _Sdílet_ draws nothing on a computer, and its empty wrapper would still take a gap. */
  '& > :empty': { display: 'none' },
  '& .vdm-copybutton__value': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '13px',
    overflowWrap: 'anywhere',
  },
})

const linkLabelStyle = css({ fontSize: '15px', fontWeight: 600 })

/* The Doc's title takes most of what is left and the artworks the rest; the tag and the actions
   keep their width, _Předat ke korektuře_ and `⋯` together 216 px (`12a`, `12k`). */
const ARTICLE_COLUMNS = 'minmax(180px, 3fr) 160px minmax(110px, 1fr) 216px'

/* A row without the button has only `⋯`, at the far end (`12k`). */
const actionsCellStyle = css({
  alignItems: 'center',
  display: 'flex',
  gap: '8px',
  justifyContent: 'flex-end',
})

const handOverFormStyle = css({ display: 'flex' })

const quietStyle = css({ color: 'var(--text-tertiary)' })

/* Holds the hidden name of the actions column: an absolute `.vdm-sr-only` with no positioned
   ancestor escapes the table that scrolls sideways on a phone and widens the whole page. */
const actionHeaderStyle = css({ position: 'relative' })

const artworksCellStyle = css({
  display: 'flex',
  flexDirection: 'column',
  fontSize: '14px',
  gap: '2px',
  '& small': { color: 'var(--text-secondary)', fontSize: '13px' },
})

/* The tag of a row with a final version opens it (`12b`): a link that looks like the tag. */
const stateLinkStyle = css({
  borderRadius: 'var(--radius-md)',
  color: 'inherit',
  display: 'inline-flex',
  textDecoration: 'none',
  '&:focus-visible': { boxShadow: 'var(--focus-shadow)', outline: 'none' },
})

/* The open row's band, as `12b` draws it: on the tint of the row, under it in the same table. */
const clauseBandStyle = css({
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border)',
  padding: '16px 20px 20px',
})
const clauseBodyStyle = css({ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 })
/* One author's cells take their places in the grid of all of them. */
const clauseAuthorStyle = css({ display: 'contents' })
const clausePeopleStyle = css({
  alignItems: 'center',
  display: 'grid',
  fontSize: '14px',
  gap: '8px 16px',
  gridTemplateColumns: 'minmax(0, 1fr) fit-content(200px) fit-content(160px)',
  '@media (max-width: 560px)': { gridTemplateColumns: 'minmax(0, 1fr) auto' },
})
const clausePersonStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  overflowWrap: 'anywhere',
})
const clauseMetaStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '13px',
  minWidth: 0,
  overflowWrap: 'anywhere',
})
/* A reply or a technical text spans the row under its author, as far as three lines. */
const clauseNoteStyle = css({
  color: 'var(--text-secondary)',
  display: 'flex',
  flexDirection: 'column',
  fontSize: '13px',
  gap: '4px',
  gridColumn: '1 / -1',
  minWidth: 0,
  overflowWrap: 'anywhere',
  '& blockquote': {
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
    display: '-webkit-box',
    margin: 0,
    overflow: 'hidden',
    whiteSpace: 'pre-line',
  },
})
const namesListStyle = css({ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 })
const namesLabelStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '13px',
  lineHeight: 1.4,
  margin: 0,
})
const namesStyle = css({
  color: 'var(--text-primary)',
  display: 'grid',
  fontSize: '14px',
  gap: '2px 16px',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  listStyle: 'none',
  margin: 0,
  overflowWrap: 'anywhere',
  padding: 0,
})
const clauseActionsStyle = css({ display: 'flex', flexWrap: 'wrap', gap: '8px' })

/* The Callout of a missing folder belongs to the row above it, inside the same table (`12j`). */
const bandStyle = css({ padding: '0 20px 16px' })
const bandRuleStyle = css({ borderBottom: '1px solid var(--border)' })

/* A folder's name and its icon never part at a line break. */
const folderLinkStyle = css({ fontWeight: 'inherit', whiteSpace: 'nowrap' })
const newTabIconStyle = css({ marginLeft: '2px', verticalAlign: '-0.125em' })

/* What waits on the editors, in the ink of _Čeká na vás_ (`12a`, `11a`). */
const waitingLineStyle = css({ color: 'var(--state-attention-text)', fontWeight: 600 })

/* The file and its article take most of the row; the tag and `⋯` keep their width (`12a`). */
const ARTWORK_COLUMNS = 'minmax(160px, 2fr) minmax(150px, 1.5fr) minmax(130px, 1.2fr) 170px 44px'

const providerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  fontSize: '14px',
  minWidth: 0,
  '& small': { color: 'var(--text-secondary)', fontSize: '13px', overflowWrap: 'anywhere' },
})

const sectionBarStyle = css({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  justifyContent: 'space-between',
  '& h2': { fontSize: '16px', fontWeight: 600, margin: 0 },
})

const STATE_TONES: Readonly<Record<ArtworkState, StatusTone>> = {
  approved: 'done-outline',
  error: 'problem',
  provider: 'running',
  review: 'waiting',
}

/** A section of the detail with its count: _Články 0_, named by its heading. */
function Section(handle: Handle<{ children?: RemixNode; count?: number; title: string }>) {
  let headingId = `section-${handle.id}`

  return () => {
    let { children, count, title } = handle.props
    return (
      <section aria-labelledby={headingId} mix={sectionStyle}>
        <h2 id={headingId}>
          {title}
          {count === undefined ? null : <span mix={countStyle}>{count}</span>}
        </h2>
        {children}
      </section>
    )
  }
}

function LinkBlock(handle: Handle<{ link: LinkBlockView }>) {
  return () => {
    let { link } = handle.props
    let items: ActionMenuItem[] = [
      { href: link.openHref, label: OPEN_FORM_LABEL },
      { href: link.renewHref, isSameTab: true, label: RENEW_LINK_LABEL },
    ]

    return (
      <section aria-labelledby="link-title" mix={sectionStyle}>
        <div mix={linkHeadStyle}>
          <h2 id="link-title">{LINK_SECTION_TITLE}</h2>
          <p mix={metaStyle}>{LINK_SECTION_TEXT}</p>
        </div>
        <div mix={linkBoxStyle}>
          <div class={link.isChanged ? 'vdm-changed' : undefined}>
            <div mix={linkRowStyle}>
              <div mix={linkBodyStyle}>
                <span mix={linkLabelStyle}>{ARTICLE_LINK_LABEL}</span>
                <CopyButton isFocused={link.isChanged} shown={link.shown} value={link.url} />
                <span mix={metaStyle}>{link.usage}</span>
                <span>
                  <ShareButton label={SHARE_LABEL} text={link.shareText} />
                </span>
              </div>
              <ActionMenu items={items} label="Další akce odkazu na nový článek" />
            </div>
          </div>
        </div>
      </section>
    )
  }
}

/** A step whose subfolder names link to the folder on Drive, in a new tab (`12j`). */
function FolderHeading(
  handle: Handle<{ heading: readonly HeadingPart[]; urls: MissingFoldersView['urls'] }>,
) {
  return () => {
    let { heading, urls } = handle.props
    return (
      <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
        {heading.map((part) => {
          if (typeof part === 'string') return part
          let url = urls[part.folder]
          if (url === undefined) return part.name
          return (
            <a class="vdm-link" href={url} mix={folderLinkStyle} rel="noopener" target="_blank">
              {part.name}
              <svg
                aria-hidden="true"
                fill="none"
                height="1em"
                mix={newTabIconStyle}
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="1em"
              >
                <path d="M15 3h6v6" />
                <path d="M10 14 21 3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
              <span class="vdm-sr-only">{tied` (otevře se v nové záložce)`}</span>
            </a>
          )
        })}
      </p>
    )
  }
}

function MissingFoldersBand(handle: Handle<{ isLast: boolean; missing: MissingFoldersView }>) {
  return () => {
    let { isLast, missing } = handle.props
    return (
      <div mix={isLast ? bandStyle : [bandStyle, bandRuleStyle]} role="row">
        <div role="cell">
          <Callout tone="error">
            <FolderHeading heading={missing.heading} urls={missing.urls} />
            <p style={{ margin: '0 0 8px' }}>{missing.text}</p>
            <form action={missing.checkAction} class="vdm-callout__actions" method="post">
              <CsrfField />
              <button class="vdm-btn vdm-btn--outline vdm-btn--sm" type="submit">
                {CHECK_AGAIN_LABEL}
              </button>
            </form>
          </Callout>
        </div>
      </div>
    )
  }
}

function ArticleRow(
  handle: Handle<{ article: ArticleRowView; csrfToken: string; isLast: boolean }>,
) {
  return () => {
    let { article, csrfToken, isLast } = handle.props
    let items: ActionMenuItem[] = [
      { href: article.documentUrl, label: 'Otevřít dokument' },
      ...(article.pdfUrl === null ? [] : [{ href: article.pdfUrl, label: OPEN_PDF_LABEL }]),
      ...(article.artworksUrl === null
        ? []
        : [{ copyText: article.artworksUrl, label: COPY_ARTWORKS_LINK_LABEL }]),
      ...(article.showReplyHref === null
        ? []
        : [{ href: article.showReplyHref, label: SHOW_REPLY_LABEL }]),
    ]
    /* The rare step back, after a line, so the main step of the table stays the row's (`12k`). */
    if (article.cancelHandoverAction !== null) {
      items.push(
        { isSeparator: true },
        { action: article.cancelHandoverAction, csrfToken, label: CANCEL_HANDOVER_LABEL },
      )
    }
    if (article.cancelFinalAction !== null) {
      items.push(
        { isSeparator: true },
        { action: article.cancelFinalAction, csrfToken, label: CANCEL_FINAL_LABEL },
      )
    }
    return (
      <>
        <TableRow
          columns={ARTICLE_COLUMNS}
          id={`article-${article.id}`}
          isLast={isLast || article.missing !== null || article.clauses !== null}
          isSelected={article.isOpen}
        >
          <TableRowTitle
            href={article.documentUrl}
            isNewTab
            sub={article.authors}
            title={article.name}
          />
          <span role="cell">
            {article.stateHref === null ? (
              <StatusTag detail={article.state.detail} tone={article.state.tone}>
                {article.state.label}
              </StatusTag>
            ) : (
              <a href={article.stateHref} mix={stateLinkStyle}>
                <StatusTag
                  detail={article.state.detail}
                  isOnTint={article.isOpen}
                  tone={article.state.tone}
                >
                  {article.state.label}
                </StatusTag>
              </a>
            )}
          </span>
          {article.artworks.count === 0 ? (
            <span mix={quietStyle} role="cell">
              —
            </span>
          ) : (
            <span mix={artworksCellStyle} role="cell">
              <span>{article.artworks.count}</span>
              {article.artworks.line === null ? null : (
                <small mix={article.artworks.line.isWaiting ? waitingLineStyle : undefined}>
                  {article.artworks.line.text}
                </small>
              )}
            </span>
          )}
          <span mix={actionsCellStyle} role="cell">
            {article.handOverAction === null ? null : (
              <form action={article.handOverAction} method="post" mix={handOverFormStyle}>
                <CsrfField />
                <PendingActions
                  accessibleLabel={handOverButtonLabel(article.name)}
                  emphasis="outline"
                  label={HAND_OVER_LABEL}
                  pendingLabel={HANDING_OVER_LABEL}
                />
              </form>
            )}
            <ActionMenu items={items} label={`Další akce článku ${article.name}`} />
          </span>
        </TableRow>
        {article.clauses === null ? null : <ClauseBand clauses={article.clauses} />}
        {article.missing === null ? null : (
          <MissingFoldersBand isLast={isLast} missing={article.missing} />
        )}
      </>
    )
  }
}

/**
 * The open row (`12b`, `12q`): each author with the clause's tag and its line, who marked the
 * final version and when, the names the clauses carry, and the row's steps. A row of the table,
 * as the band of a missing folder is, so the table stays one list for a reader.
 */
function ClauseBand(handle: Handle<{ clauses: ClausesView }>) {
  return () => {
    let { clauses } = handle.props
    return (
      <div mix={clauseBandStyle} role="row">
        <div mix={clauseBodyStyle} role="cell">
          <div mix={clausePeopleStyle}>
            {clauses.authors.map((author) => (
              <div key={author.email} mix={clauseAuthorStyle}>
                <span mix={clausePersonStyle}>
                  {author.name}
                  <span mix={clauseMetaStyle}>{author.email}</span>
                </span>
                <StatusTag isInline isOnTint tone={author.tag.tone}>
                  {author.tag.label}
                </StatusTag>
                <span mix={clauseMetaStyle}>
                  {author.quote === null ? (author.tag.detail ?? '') : ''}
                </span>
                {author.quote === null && author.link === null ? null : (
                  <span mix={clauseNoteStyle}>
                    {author.quote === null ? null : <blockquote>{author.quote}</blockquote>}
                    {author.link === null ? null : (
                      <a href={author.link.href}>{author.link.label}</a>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
          <span mix={clauseMetaStyle}>{clauses.markedLine}</span>
          <div mix={namesListStyle}>
            <p mix={namesLabelStyle}>{clauses.namesLabel}</p>
            <ul aria-label={clauses.namesLabel} mix={namesStyle}>
              {clauses.names.map((name, index) => (
                <li key={index}>{name}</li>
              ))}
            </ul>
          </div>
          <div mix={clauseActionsStyle}>
            <a
              class="vdm-btn vdm-btn--outline vdm-btn--sm"
              href={clauses.pdfUrl}
              rel="noopener"
              target="_blank"
            >
              {OPEN_PDF_LABEL}
              <span class="vdm-sr-only">{tied` (otevře se v nové záložce)`}</span>
            </a>
            <a
              class="vdm-btn vdm-btn--outline vdm-btn--sm"
              href={clauses.documentUrl}
              rel="noopener"
              target="_blank"
            >
              Otevřít dokument
              <span class="vdm-sr-only">{tied` (otevře se v nové záložce)`}</span>
            </a>
            {clauses.resend === null ? null : (
              <form action={clauses.resend.action} method="post">
                <CsrfField />
                <button class="vdm-btn vdm-btn--ghost vdm-btn--sm" type="submit">
                  {clauses.resend.label}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }
}

function Articles(
  handle: Handle<{
    articles: readonly ArticleRowView[]
    csrfToken: string
    missingAddress?: MissingAddressView
  }>,
) {
  return () => {
    let { articles, csrfToken, missingAddress } = handle.props
    return (
      <Section count={articles.length} title="Články">
        {missingAddress === undefined ? null : (
          <Callout tone="warning">
            <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
              {missingAddress.title}
            </p>
            <p style={{ margin: missingAddress.action === undefined ? 0 : '0 0 8px' }}>
              {missingAddress.text}
            </p>
            {missingAddress.action === undefined ? null : (
              <div class="vdm-callout__actions">
                <a class="vdm-btn vdm-btn--outline vdm-btn--sm" href={missingAddress.action.href}>
                  {missingAddress.action.label}
                </a>
              </div>
            )}
          </Callout>
        )}
        {articles.length === 0 ? (
          <EmptyState>
            <EmptyStateText>{ARTICLES_EMPTY_TEXT}</EmptyStateText>
          </EmptyState>
        ) : (
          <div aria-label="Články" class="vdm-table" role="table">
            <TableRow columns={ARTICLE_COLUMNS} isHead>
              <span role="columnheader">Článek</span>
              <span role="columnheader">Stav</span>
              <span role="columnheader">Obrazová díla</span>
              <span mix={actionHeaderStyle} role="columnheader">
                <span class="vdm-sr-only">Akce</span>
              </span>
            </TableRow>
            {articles.map((article, index) => (
              <ArticleRow
                article={article}
                csrfToken={csrfToken}
                isLast={index === articles.length - 1}
                key={article.id}
              />
            ))}
          </div>
        )}
      </Section>
    )
  }
}

function ArtworkRow(
  handle: Handle<{ artwork: ArtworkRowView; csrfToken: string; isLast: boolean }>,
) {
  return () => {
    let { artwork, csrfToken, isLast } = handle.props
    let items: ActionMenuItem[] = [{ href: artwork.driveUrl, label: OPEN_ARTWORK_LABEL }]
    let actions = artwork.batchActions
    if (actions !== null && (actions.resendAction !== null || actions.discardHref !== null)) {
      items.push({ isSeparator: true })
      if (actions.resendAction !== null) {
        items.push({ action: actions.resendAction, csrfToken, label: resendLabel(actions.count) })
      }
      if (actions.discardHref !== null) {
        items.push({
          href: actions.discardHref,
          isSameTab: true,
          label: discardLabel(actions.count),
        })
      }
    }
    return (
      <TableRow columns={ARTWORK_COLUMNS} isLast={isLast}>
        <TableRowTitle
          href={artwork.driveUrl}
          isNewTab
          sub={artwork.articleName}
          title={artwork.name}
        />
        <span mix={providerStyle} role="cell">
          <span>{artwork.providerName}</span>
          <small>{artwork.providerEmail}</small>
        </span>
        <span mix={metaStyle} role="cell">
          {artwork.author} ·{' '}
          {artwork.source === null ? (
            'neuveden'
          ) : (
            <a href={artwork.source.href} rel="noopener noreferrer" target="_blank">
              {artwork.source.shown}
            </a>
          )}
        </span>
        <span role="cell">
          <StatusTag detail={artwork.stateDetail} tone={STATE_TONES[artwork.state]}>
            {ARTWORK_STATE_LABELS[artwork.state]}
          </StatusTag>
        </span>
        <span role="cell">
          <ActionMenu items={items} label={artworkMenuLabel(artwork.name)} />
        </span>
      </TableRow>
    )
  }
}

/** _Obrazová díla_ of the issue in one table, the filter in the address (`12a`). */
function Artworks(handle: Handle<{ artworks: ArtworksView; csrfToken: string }>) {
  return () => {
    let { artworks, csrfToken } = handle.props
    let total = artworks.counts.all
    return (
      <section aria-labelledby="artworks-title" mix={sectionStyle}>
        <div mix={sectionBarStyle}>
          <h2 id="artworks-title">
            {ARTWORKS_SECTION_TITLE}
            <span mix={countStyle}>{total}</span>
          </h2>
          {total === 0 ? null : (
            <StateFilter
              label="Stav"
              items={ARTWORK_FILTERS.map((filter) => ({
                count: artworks.counts[filter.value],
                href: artworks.hrefOf(filter.value),
                isActive: filter.value === artworks.filter,
                isWaiting: filter.value !== 'all' && isWaiting(filter.value),
                label: filter.label,
              }))}
            />
          )}
        </div>
        {total === 0 ? (
          <EmptyState>
            <EmptyStateText>{ARTWORKS_EMPTY_TEXT}</EmptyStateText>
          </EmptyState>
        ) : artworks.rows.length === 0 ? null : (
          <div aria-label={ARTWORKS_SECTION_TITLE} class="vdm-table" role="table">
            <TableRow columns={ARTWORK_COLUMNS} isHead>
              <span role="columnheader">{ARTWORK_COLUMN}</span>
              <span role="columnheader">{PROVIDER_COLUMN}</span>
              <span role="columnheader">{AUTHOR_SOURCE_COLUMN}</span>
              <span role="columnheader">{STATE_COLUMN}</span>
              <span mix={actionHeaderStyle} role="columnheader">
                <span class="vdm-sr-only">Akce</span>
              </span>
            </TableRow>
            {artworks.rows.map((artwork, index) => (
              <ArtworkRow
                artwork={artwork}
                csrfToken={csrfToken}
                isLast={index === artworks.rows.length - 1}
                key={artwork.id}
              />
            ))}
          </div>
        )}
      </section>
    )
  }
}

/** `12o`: discarding takes the batch's files to the bin, so it is asked first. */
function DiscardDialog(handle: Handle<{ discarding: DiscardView }>) {
  return () => {
    let { discarding } = handle.props
    return (
      <Dialog maxWidth="360px">
        <DialogTitle>{discardDialogTitle(discarding.count)}</DialogTitle>
        <div class="vdm-dialog__body">
          {discarding.folderGone === undefined ? null : (
            <div role="alert">
              <Callout tone="error">
                <FolderHeading
                  heading={discarding.folderGone.heading}
                  urls={discarding.folderGone.urls}
                />
                <p style={{ margin: 0 }}>{DISCARD_KEPT_TEXT}</p>
              </Callout>
            </div>
          )}
          {discarding.refusal === undefined ? null : (
            <div role="alert">
              <Callout tone="error">
                {/* The account's address does not break by itself, and on a phone it would widen
                    the dialog past the screen. */}
                <p
                  class="vdm-callout__title"
                  style={{ margin: '0 0 4px', overflowWrap: 'anywhere' }}
                >
                  {DISCARD_REFUSALS[discarding.refusal].title}
                </p>
                <p style={{ margin: 0 }}>{DISCARD_REFUSALS[discarding.refusal].text}</p>
              </Callout>
            </div>
          )}
          <p class="vdm-dialog__text">
            {discardDialogText(discarding.articleName, discarding.email)}
          </p>
        </div>
        <form action={discarding.action} class="vdm-dialog__actions" method="post">
          <CsrfField />
          {/* Focus starts on the way back, so Enter on arrival never discards anything. */}
          <a autofocus class="vdm-btn vdm-btn--ghost vdm-btn--sm" href={discarding.cancelHref}>
            {DISCARD_CANCEL_LABEL}
          </a>
          <button class="vdm-btn vdm-btn--danger vdm-btn--sm" type="submit">
            {DISCARD_CONFIRM_LABEL}
          </button>
        </form>
      </Dialog>
    )
  }
}

/** `02d`: renewing takes the link from everybody who has it, so it is asked first. */
function RenewDialog(handle: Handle<{ issue: Issue }>) {
  return () => {
    let { issue } = handle.props
    return (
      <Dialog maxWidth="360px">
        <DialogTitle>{RENEW_DIALOG_TITLE}</DialogTitle>
        <div class="vdm-dialog__body">
          <p class="vdm-dialog__text">{RENEW_DIALOG_TEXT}</p>
          <p class="vdm-dialog__text">{RENEW_DIALOG_NOTE}</p>
        </div>
        <form
          action={routes.issues.renewLink.href({ name: issue.name })}
          class="vdm-dialog__actions"
          method="post"
        >
          <CsrfField />
          {/* Focus starts on the way back, so Enter on arrival never takes the link away. */}
          <a
            autofocus
            class="vdm-btn vdm-btn--ghost vdm-btn--sm"
            href={routes.issues.show.href({ name: issue.name })}
          >
            Zrušit
          </a>
          <button class="vdm-btn vdm-btn--danger vdm-btn--sm" type="submit">
            {RENEW_CONFIRM_LABEL}
          </button>
        </form>
      </Dialog>
    )
  }
}

/**
 * `/issues/{name}`: the header every issue has, then what its state allows.
 *
 * An unfinished issue (`12i`) has one action, and the place where the link for the newsroom
 * will stand without the link, so nobody copies it before it is valid. An active one has its
 * link, its articles and its artworks in the drawn order (`12a`, `12c`); artwork groups and the
 * material for print are later work, and stand there once their data exists.
 */
export function DetailPage(handle: Handle<DetailPageProps>) {
  return () => {
    let {
      articles,
      artworks,
      discarding,
      driveAccount,
      isFolderGone = false,
      isRenewing = false,
      issue,
      link,
      missingAddress,
      person,
      toasts,
    } = handle.props
    let state = issueState(issue)
    let folderId = issue.folderIds.issue

    return (
      <Document title={issue.name}>
        <Layout
          active="issues"
          driveAccount={driveAccount}
          isInert={isRenewing || discarding !== undefined}
          person={person}
          title={issue.name}
          toasts={toasts}
        >
          <div mix={pageStyle}>
            <div mix={headStyle}>
              <a class="vdm-parentlink" href={routes.home.href()}>
                <span aria-hidden="true">‹</span>
                <span>Vydání</span>
              </a>
              <div mix={titleBarStyle}>
                <div mix={titleStyle}>
                  <h1 class="vdm-page-title">{issue.name}</h1>
                  <IssueStateTag state={state} />
                </div>
                {folderId === null ? null : (
                  <a
                    class="vdm-btn vdm-btn--outline vdm-btn--sm"
                    href={folderUrl(folderId)}
                    rel="noopener"
                    target="_blank"
                  >
                    Složka na Disku
                    <span class="vdm-sr-only">{tied` (otevře se v nové záložce)`}</span>
                  </a>
                )}
              </div>
              <p mix={metaStyle}>{detailStartedLine(issue)}</p>
            </div>

            {state === 'unfinished' ? (
              <>
                <Callout tone="error">
                  {isFolderGone ? (
                    <p style={{ margin: '0 0 8px' }}>{folderGoneMessage(issue.name)}</p>
                  ) : (
                    <>
                      <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                        {unfinishedTitle(issue.name)}
                      </p>
                      <p style={{ margin: '0 0 8px' }}>{unfinishedText(missingFolders(issue))}</p>
                    </>
                  )}
                  <FinishIssueForm issue={issue} placement="callout" returnTo="detail" />
                </Callout>
                <Section title={LINK_SECTION_TITLE}>
                  <p mix={placeholderStyle}>{LINK_PLACEHOLDER_TEXT}</p>
                </Section>
              </>
            ) : (
              <>
                {link === undefined ? null : <LinkBlock link={link} />}
                <Articles
                  articles={articles}
                  csrfToken={getCsrfToken(getContext())}
                  missingAddress={missingAddress}
                />
                <Artworks artworks={artworks} csrfToken={getCsrfToken(getContext())} />
              </>
            )}
          </div>
        </Layout>
        {isRenewing ? <RenewDialog issue={issue} /> : null}
        {discarding === undefined ? null : <DiscardDialog discarding={discarding} />}
      </Document>
    )
  }
}
