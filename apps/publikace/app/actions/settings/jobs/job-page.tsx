import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import { DETAILS_LABEL, HISTORY_FOOT, JOBS_TITLE, TRIGGER_WHO } from '../../../domain/jobs.ts'
import { routes } from '../../../routes.ts'
import { Callout } from '../../../ui/callout/component.tsx'
import { Layout } from '../../../ui/layout/component.tsx'
import type { PanelPerson } from '../../../ui/panel/component.tsx'
import type { ToastMessage } from '../../../ui/toast/component.tsx'
import type { DriveStatus } from '../../issues/overview-page.tsx'
import { Document } from '../../document.tsx'

export type JobHistoryItem = { event: string; time: string }

export type JobPageProps = {
  /**
   * While the job is _S chybou_: what holds, and the technical text when the job sent one. While
   * it is _Neběží_: the step as the title, and what the app knows of the job (`14e`).
   */
  callout: { error: string | null; text: string; title: string | null } | null
  driveAccount: { expectedEmail: string; status: DriveStatus }
  /** The runs, newest first; empty only for a job that never reported. */
  history: readonly JobHistoryItem[]
  name: string
  /** Said instead of the history when there is none (`13c`'s sentence). */
  neverText: string
  person: PanelPerson
  toasts?: readonly ToastMessage[]
}

/* `14e` draws a 760 px column. */
const pageStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  maxWidth: '760px',
  width: '100%',
})

const detailsStyle = css({
  marginTop: '8px',
  '& > summary': { cursor: 'pointer', fontWeight: 500, width: 'fit-content' },
  '& > pre': {
    fontSize: '13px',
    margin: '8px 0 0',
    overflowWrap: 'anywhere',
    whiteSpace: 'pre-wrap',
  },
})

const neverStyle = css({ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 })

/**
 * `/settings/jobs/{job}` (`14e`): what the job reported, one run a line, for the last days the
 * foot names. The technical text is the job's own and waits under a disclosure: the sentence above
 * it is the one that tells the editors where they stand.
 */
export function JobPage(handle: Handle<JobPageProps>) {
  return () => {
    let { callout, driveAccount, history, name, neverText, person, toasts } = handle.props

    return (
      <Document title={name}>
        <Layout
          active="settings"
          driveAccount={driveAccount}
          person={person}
          title={name}
          toasts={toasts}
        >
          <div mix={pageStyle}>
            <a class="vdm-parentlink" href={routes.settings.jobs.index.href()}>
              <span aria-hidden="true">‹</span>
              <span>{JOBS_TITLE}</span>
            </a>
            <h1 class="vdm-page-title" style={{ margin: 0 }}>
              {name}
            </h1>
            {callout === null ? null : (
              <Callout tone="error">
                {/* Inline, as the other Callouts write it: `css()` would lose to the design
                    system's own rules for a paragraph in the body. */}
                {callout.title === null ? null : (
                  <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                    {callout.title}
                  </p>
                )}
                <p style={{ margin: 0 }}>{callout.text}</p>
                {callout.error === null ? null : (
                  <details mix={detailsStyle}>
                    <summary>{DETAILS_LABEL}</summary>
                    <pre>{callout.error}</pre>
                  </details>
                )}
              </Callout>
            )}
            {history.length === 0 ? (
              <p mix={neverStyle}>{neverText}</p>
            ) : (
              <ol class="vdm-history">
                {history.map((item) => (
                  <li class="vdm-history__item">
                    <span class="vdm-history__time">{item.time}</span>
                    <span class="vdm-history__event">
                      {item.event}
                      <span class="vdm-history__who"> · {TRIGGER_WHO}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <div class="vdm-foot">{HISTORY_FOOT}</div>
          </div>
        </Layout>
      </Document>
    )
  }
}
