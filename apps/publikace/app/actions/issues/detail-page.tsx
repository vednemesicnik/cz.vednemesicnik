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
import { routes } from '../../routes.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { Layout } from '../../ui/layout/component.tsx'
import type { PanelPerson } from '../../ui/panel/component.tsx'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { Document } from '../document.tsx'
import { FinishIssueForm, IssueStateTag } from './issue-parts.tsx'
import type { DriveStatus } from './overview-page.tsx'

export type DetailPageProps = {
  driveAccount: { expectedEmail: string; status: DriveStatus }
  /** _Dokončit vydání_ found the stored issue folder gone, so it created nothing (`12i`). */
  isFolderGone?: boolean
  issue: Issue
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

/**
 * `/issues/{name}`: the header every issue has, then what its state allows.
 *
 * An unfinished issue (`12i`) has one action, and the place where the link for the newsroom
 * will stand without the link, so nobody copies it before it is valid. An active one has its
 * sections as `12c` draws a fresh issue. The link for the newsroom, artwork groups and the
 * material for print are later work; the sections stand in the drawn order as far as their data
 * exists.
 */
export function DetailPage(handle: Handle<DetailPageProps>) {
  return () => {
    let { driveAccount, isFolderGone = false, issue, person, toasts } = handle.props
    let state = issueState(issue)
    let folderId = issue.folderIds.issue

    return (
      <Document title={issue.name}>
        <Layout
          active="issues"
          driveAccount={driveAccount}
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
                <Section title="Odkaz pro redakci">
                  <p mix={placeholderStyle}>{LINK_PLACEHOLDER_TEXT}</p>
                </Section>
              </>
            ) : (
              <>
                <Section count={0} title="Články">
                  <p mix={placeholderStyle}>{ARTICLES_EMPTY_TEXT}</p>
                </Section>
                <Section count={0} title="Obrazová díla">
                  <p mix={placeholderStyle}>{ARTWORKS_EMPTY_TEXT}</p>
                </Section>
              </>
            )}
          </div>
        </Layout>
      </Document>
    )
  }
}
