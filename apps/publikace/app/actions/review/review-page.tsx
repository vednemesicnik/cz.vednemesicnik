import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import {
  EMPTY_ACTION,
  EMPTY_TEXT,
  EMPTY_TITLE,
  REVIEW_LEAD,
  REVIEW_TITLE,
} from '../../domain/review.ts'
import { routes } from '../../routes.ts'
import { EmptyState } from '../../ui/empty-state/component.tsx'
import { EmptyStateText } from '../../ui/empty-state-text/component.tsx'
import { EmptyStateTitle } from '../../ui/empty-state-title/component.tsx'
import { Layout } from '../../ui/layout/component.tsx'
import { ListHeader } from '../../ui/list-header/component.tsx'
import { ListHeaderTitle } from '../../ui/list-header-title/component.tsx'
import type { PanelPerson } from '../../ui/panel/component.tsx'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { Document } from '../document.tsx'
import type { DriveStatus } from '../issues/overview-page.tsx'
import { QueueCard, type QueueCardView } from './queue-card.tsx'

export type ReviewPageProps = {
  cards: readonly QueueCardView[]
  driveAccount: { expectedEmail: string; status: DriveStatus }
  person: PanelPerson
  /** When the replies were read, or which job is not reading them (`13a`, `13c`). */
  readLine: string
  toasts?: readonly ToastMessage[]
}

const headStyle = css({ display: 'flex', flexDirection: 'column', gap: '6px' })

const leadStyle = css({ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 })

const readStyle = css({ color: 'var(--text-tertiary)', fontSize: '13px', margin: 0 })

/* The drawing's measure: a card wider than this would make the quote a line nobody reads. */
const queueStyle = css({ maxWidth: '860px', width: '100%' })

/**
 * _Ke kontrole_ (`13a`): the replies to decide, oldest first, and the consents whose archive
 * failed (`13c`). No filter of kinds yet: only artworks reach the queue until the article
 * consents move to the app (#32).
 */
export function ReviewPage(handle: Handle<ReviewPageProps>) {
  return () => {
    let { cards, driveAccount, person, readLine, toasts } = handle.props

    return (
      <Document title={REVIEW_TITLE}>
        <Layout
          active="review"
          driveAccount={driveAccount}
          person={person}
          title={REVIEW_TITLE}
          toasts={toasts}
        >
          <div mix={headStyle}>
            <ListHeader>
              <ListHeaderTitle>{REVIEW_TITLE}</ListHeaderTitle>
            </ListHeader>
            <p mix={leadStyle}>{REVIEW_LEAD}</p>
            <p mix={readStyle}>{readLine}</p>
          </div>
          {cards.length === 0 ? (
            <EmptyState>
              <EmptyStateTitle>{EMPTY_TITLE}</EmptyStateTitle>
              <EmptyStateText>{EMPTY_TEXT}</EmptyStateText>
              <a class="vdm-btn vdm-btn--outline vdm-btn--sm" href={routes.home.href()}>
                {EMPTY_ACTION}
              </a>
            </EmptyState>
          ) : (
            <div mix={queueStyle}>
              <ol class="vdm-queue">
                {cards.map((card) => (
                  <QueueCard card={card} />
                ))}
              </ol>
            </div>
          )}
        </Layout>
      </Document>
    )
  }
}
