import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import { JOBS_TITLE, type JobTag, SHOW_JOB_LABEL } from '../../../domain/jobs.ts'
import type { JobState } from '../../../domain/job-run.ts'
import type { DriveStatus } from '../../issues/overview-page.tsx'
import { routes } from '../../../routes.ts'
import { Layout } from '../../../ui/layout/component.tsx'
import type { PanelPerson } from '../../../ui/panel/component.tsx'
import { StatusTag, type StatusTone } from '../../../ui/status-tag/component.tsx'
import { TableRow } from '../../../ui/table-row/component.tsx'
import type { ToastMessage } from '../../../ui/toast/component.tsx'
import { Document } from '../../document.tsx'

/**
 * The tone of each tag, as `14d`'s table colours it. _Neběží_ is `problem` like _S chybou_: it
 * stands under the rose banner, where grey would say nobody is waiting (`14i`).
 */
export const JOB_TONES: Record<JobState['kind'], StatusTone> = {
  failed: 'problem',
  never: 'neutral',
  ok: 'done',
  running: 'running',
  stopped: 'problem',
}

export type JobRowView = {
  name: string
  /** _Zobrazit_ for a job somebody first needs to look at (`14d`). */
  showHref: string | null
  /** `null` before the first report: the interval comes with it. */
  schedule: string | null
  state: JobState['kind']
  summary: string
  tag: JobTag
}

export type JobsPageProps = {
  driveAccount: { expectedEmail: string; status: DriveStatus }
  person: PanelPerson
  rows: readonly JobRowView[]
  toasts?: readonly ToastMessage[]
}

/* `14d`'s grid, 1.6 : 0.9 : 1.5, so the digest's longer line wraps only after its full stop
   (`tlb36tk0`); the tag's line wraps in its own column. */
const COLUMNS = 'minmax(260px, 1.6fr) minmax(130px, 0.9fr) minmax(170px, 1.5fr) 110px'

const pageStyle = css({ display: 'flex', flexDirection: 'column', gap: '20px' })

/**
 * `/settings/jobs` (`14d`): the jobs that report to the app, each with its schedule, its tag and
 * its last run. Only what the jobs reported: the app does not see the triggers in Apps Script.
 */
export function JobsPage(handle: Handle<JobsPageProps>) {
  return () => {
    let { driveAccount, person, rows, toasts } = handle.props

    return (
      <Document title={JOBS_TITLE}>
        <Layout
          active="settings"
          driveAccount={driveAccount}
          person={person}
          title={JOBS_TITLE}
          toasts={toasts}
        >
          <div mix={pageStyle}>
            <a class="vdm-parentlink" href={routes.settings.index.href()}>
              <span aria-hidden="true">‹</span>
              <span>Nastavení</span>
            </a>
            <h1 class="vdm-page-title" style={{ margin: 0 }}>
              {JOBS_TITLE}
            </h1>
            <div aria-label={JOBS_TITLE} class="vdm-table" role="table">
              <TableRow columns={COLUMNS} isHead>
                <span role="columnheader">Úloha</span>
                <span role="columnheader">Kdy</span>
                <span role="columnheader">Poslední běh</span>
                <span role="columnheader">
                  <span class="vdm-sr-only">Akce</span>
                </span>
              </TableRow>
              {rows.map((row, index) => (
                <TableRow columns={COLUMNS} isLast={index === rows.length - 1}>
                  <div class="vdm-row__title" role="cell">
                    <span style={{ fontWeight: 500 }}>{row.name}</span>
                    <span class="vdm-row__sub">{row.summary}</span>
                  </div>
                  <span role="cell">{row.schedule ?? ''}</span>
                  <span role="cell">
                    <StatusTag detail={row.tag.detail} tone={JOB_TONES[row.state]}>
                      {row.tag.label}
                    </StatusTag>
                  </span>
                  <span role="cell">
                    {row.showHref === null ? null : (
                      <a class="vdm-btn vdm-btn--outline vdm-btn--sm" href={row.showHref}>
                        {SHOW_JOB_LABEL}
                        <span class="vdm-sr-only"> {row.name}</span>
                      </a>
                    )}
                  </span>
                </TableRow>
              ))}
            </div>
          </div>
        </Layout>
      </Document>
    )
  }
}
