import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import {
  EMPTY_ACTION,
  EMPTY_TEXT,
  EMPTY_TITLE,
  emptyKindTitle,
  otherKindText,
  READ_LIST_LABEL,
  type ReadLine,
  REVIEW_KINDS,
  REVIEW_KINDS_LABEL,
  REVIEW_LEAD,
  REVIEW_TITLE,
  type ReviewKind,
  SHOW_ALL_LABEL,
} from '../../domain/review.ts'
import { routes } from '../../routes.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { EmptyState } from '../../ui/empty-state/component.tsx'
import { EmptyStateText } from '../../ui/empty-state-text/component.tsx'
import { EmptyStateTitle } from '../../ui/empty-state-title/component.tsx'
import { Layout } from '../../ui/layout/component.tsx'
import { ListHeader } from '../../ui/list-header/component.tsx'
import { ListHeaderTitle } from '../../ui/list-header-title/component.tsx'
import type { PanelPerson } from '../../ui/panel/component.tsx'
import { CopyButton } from '../../ui/public/copy-button/component.tsx'
import { StateFilter } from '../../ui/state-filter/component.tsx'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { Document } from '../document.tsx'
import type { DriveStatus } from '../issues/overview-page.tsx'
import { QueueCard, type QueueCardView } from './queue-card.tsx'

export type ReviewPageProps = {
  /** The cards of the kind chosen in the filter. */
  cards: readonly QueueCardView[]
  /** The cards waiting for a decision, per kind: the one just decided counts nowhere (`13b`). */
  counts: Readonly<Record<ReviewKind, number>>
  driveAccount: { expectedEmail: string; status: DriveStatus }
  /** Whether the queue holds a card of any kind, the one just decided included. */
  hasCards: boolean
  hrefOf(kind: ReviewKind): string
  kind: ReviewKind
  person: PanelPerson
  /** How each job's last read ended, or that it is not reading (`13i`, `13c`). */
  readLines: readonly ReadLine[]
  toasts?: readonly ToastMessage[]
  /** An answer whose card left the queue while it was written, shown once (`gjovqe1p`). */
  unsent?: UnsentAnswer | null
}

/**
 * The text of an answer that did not go and that no card holds: its card left the queue, decided
 * or on a final version a newer one replaced, or another answer on record stands in its form.
 * Nothing stores it, so this one load is the last chance to copy it. A card that stays until the
 * next load holds its own text locked instead (`13e`).
 */
export type UnsentAnswer = {
  /** `‹jméno› · ‹adresa›`, who it was for. */
  line: string
  note: string
  text: string
  title: string
}
const headStyle = css({ display: 'flex', flexDirection: 'column', gap: '6px' })

const leadStyle = css({ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 })

/*
 * One line a job (`13i`). A part stays whole and the line breaks between parts, at „·“, unless a
 * part alone is wider than the screen: an inline block wraps inside itself only then.
 */
const readStyle = css({
  color: 'var(--text-tertiary)',
  fontSize: '13px',
  listStyle: 'none',
  margin: 0,
  padding: 0,
  '& span': { display: 'inline-block', maxWidth: '100%' },
  '& a': { color: 'var(--link)' },
  '& a:hover': { color: 'var(--link-hover)' },
})

/* `13a`'s bar: the filter, and the line of when the replies were read beside it. */
const barStyle = css({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px 20px',
})

/* The drawing's measure: a card wider than this would make the quote a line nobody reads. */
const queueStyle = css({ maxWidth: '860px', width: '100%' })

/**
 * _Ke kontrole_ (`13a`): the replies to decide, of articles and of artworks, oldest first, and
 * the consents whose archive failed (`13c`), narrowed to one kind by the filter in the address
 * (`?kind=`). An empty queue shows no filter, as `13c` draws it.
 */
export function ReviewPage(handle: Handle<ReviewPageProps>) {
  return () => {
    let { cards, counts, driveAccount, hasCards, hrefOf, kind, person, readLines, toasts, unsent } =
      handle.props
    let read = (
      <ul aria-label={READ_LIST_LABEL} mix={readStyle}>
        {readLines.map((line) => {
          let href =
            line.job === null
              ? routes.settings.jobs.index.href()
              : routes.settings.jobs.show.href({ job: line.job })
          return (
            <li>
              {line.parts.map((part, index) => (
                <>
                  {index === 0 ? null : ' · '}
                  <span>
                    {part.before}
                    {part.link === null ? null : <a href={href}>{part.link}</a>}
                    {part.after}
                  </span>
                </>
              ))}
            </li>
          )
        })}
      </ul>
    )

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
            {hasCards ? null : read}
          </div>
          {hasCards ? (
            <div mix={barStyle}>
              <StateFilter
                items={REVIEW_KINDS.map((item) => ({
                  count: counts[item.value],
                  href: hrefOf(item.value),
                  isActive: item.value === kind,
                  label: item.label,
                }))}
                label={REVIEW_KINDS_LABEL}
              />
              {read}
            </div>
          ) : null}
          {unsent === undefined || unsent === null ? null : (
            <div mix={queueStyle}>
              <Callout tone="info">
                <p class="vdm-callout__title">{unsent.title}</p>
                {unsent.line === '' ? null : <p style={{ margin: '0 0 8px' }}>{unsent.line}</p>}
                <div style={{ margin: '0 0 8px' }}>
                  <CopyButton shown={unsent.text} value={unsent.text} />
                </div>
                <p style={{ margin: 0 }}>{unsent.note}</p>
              </Callout>
            </div>
          )}
          {cards.length === 0 && kind !== 'all' && hasCards ? (
            <EmptyState>
              <EmptyStateTitle>{emptyKindTitle(kind)}</EmptyStateTitle>
              <EmptyStateText>{otherKindText(counts.all)}</EmptyStateText>
              <a class="vdm-btn vdm-btn--outline vdm-btn--sm" href={hrefOf('all')}>
                {SHOW_ALL_LABEL}
              </a>
            </EmptyState>
          ) : cards.length === 0 ? (
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
                  /* Keyed, so a card that leaves the list does not hand its open form and its
                     typed text to the card after it. */
                  <QueueCard card={card} key={card.id} />
                ))}
              </ol>
            </div>
          )}
        </Layout>
      </Document>
    )
  }
}
