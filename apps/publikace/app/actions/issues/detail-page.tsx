import type { Handle, RemixNode } from 'remix/component'
import { css } from 'remix/component'

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
import { Layout } from '../../ui/layout/component.tsx'
import type { PanelPerson } from '../../ui/panel/component.tsx'
import { ActionMenu, type ActionMenuItem } from '../../ui/public/action-menu/component.tsx'
import { CopyButton } from '../../ui/public/copy-button/component.tsx'
import { ShareButton } from '../../ui/public/share-button/component.tsx'
import { StatusTag } from '../../ui/status-tag/component.tsx'
import { TableRow } from '../../ui/table-row/component.tsx'
import { TableRowTitle } from '../../ui/table-row-title/component.tsx'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { Document } from '../document.tsx'
import { FinishIssueForm, IssueStateTag } from './issue-parts.tsx'
import type { DriveStatus } from './overview-page.tsx'

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

/** One row of _Články_ (`12a`), with what exists of an article so far. */
export type ArticleRowView = {
  authors: string
  createdLine: string
  documentUrl: string
  id: number
  name: string
}

export type DetailPageProps = {
  articles: readonly ArticleRowView[]
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

/* The Doc's title takes most of what is left and the artworks the rest; the tag and `⋯` keep
   their width (`12a`). */
const ARTICLE_COLUMNS = 'minmax(180px, 3fr) 160px minmax(110px, 1fr) 44px'

const quietStyle = css({ color: 'var(--text-tertiary)' })

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

function ArticleRow(handle: Handle<{ article: ArticleRowView; isLast: boolean }>) {
  return () => {
    let { article, isLast } = handle.props
    return (
      <TableRow columns={ARTICLE_COLUMNS} isLast={isLast}>
        <TableRowTitle
          href={article.documentUrl}
          isNewTab
          sub={article.authors}
          title={article.name}
        />
        <span role="cell">
          <StatusTag detail={article.createdLine} tone="neutral">
            Píše se
          </StatusTag>
        </span>
        <span mix={quietStyle} role="cell">
          —
        </span>
        <span role="cell">
          <ActionMenu
            items={[{ href: article.documentUrl, label: 'Otevřít dokument' }]}
            label={`Další akce článku ${article.name}`}
          />
        </span>
      </TableRow>
    )
  }
}

function Articles(handle: Handle<{ articles: readonly ArticleRowView[] }>) {
  return () => {
    let { articles } = handle.props
    return (
      <Section count={articles.length} title="Články">
        {articles.length === 0 ? (
          <p mix={placeholderStyle}>{ARTICLES_EMPTY_TEXT}</p>
        ) : (
          <div aria-label="Články" class="vdm-table" role="table">
            <TableRow columns={ARTICLE_COLUMNS} isHead>
              <span role="columnheader">Článek</span>
              <span role="columnheader">Stav</span>
              <span role="columnheader">Obrazová díla</span>
              <span role="columnheader">
                <span class="vdm-sr-only">Akce</span>
              </span>
            </TableRow>
            {articles.map((article, index) => (
              <ArticleRow
                article={article}
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
      driveAccount,
      isFolderGone = false,
      isRenewing = false,
      issue,
      link,
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
          isInert={isRenewing}
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
                    <span class="vdm-sr-only"> (otevře se v nové záložce)</span>
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
                <Articles articles={articles} />
                <Section count={0} title="Obrazová díla">
                  <p mix={placeholderStyle}>{ARTWORKS_EMPTY_TEXT}</p>
                </Section>
              </>
            )}
          </div>
        </Layout>
        {isRenewing ? <RenewDialog issue={issue} /> : null}
      </Document>
    )
  }
}
