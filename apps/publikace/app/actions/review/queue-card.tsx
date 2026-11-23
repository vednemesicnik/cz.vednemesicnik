import type { Handle } from 'remix/component'
import { getContext } from 'remix/middleware/async-context'
import { getCsrfToken } from 'remix/middleware/csrf'

import { ANSWER_LABEL } from '../../domain/answer.ts'
import { JOBS_TITLE } from '../../domain/jobs.ts'
import { CONSENT_LABEL, SHOW_WHOLE_REPLY_LABEL, UNDO_LABEL } from '../../domain/review.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { ActionMenu, type ActionMenuItem } from '../../ui/public/action-menu/component.tsx'
import {
  AnswerCompose,
  type AnswerComposeProps,
} from '../../ui/public/answer-compose/component.tsx'
import { StatusTag, type StatusTone } from '../../ui/status-tag/component.tsx'

/** _Odpovědět_ and the form it opens (`13d`); the token is the page's, added as it is drawn. */
export type QueueCardAnswer = Omit<AnswerComposeProps, 'csrfToken'> & {
  /** `?reply=`, which opens the form on a page without script. `null` hides _Odpovědět_. */
  openHref: string | null
}

/** The answers that went from the app, under the quote (`13e`, `13f`). */
export type QueueCardAnswers = {
  isOpen: boolean
  items: { line: string | null; meta: string; text: string }[]
  title: string
}

/** One card of _Ke kontrole_, as the controller lays it out. */
export type QueueCardView = {
  answer: QueueCardAnswer | null
  answers: QueueCardAnswers | null
  callout: { text: string; title: string | null; tone: 'error' | 'info' } | null
  /** Where _Je to souhlas_ posts, or `null` where the card offers no decision. */
  consentAction: string | null
  /** The reply _Je to souhlas_ confirms, so a newer one that came meanwhile is not. */
  consentReplyId: string | null
  /** The card's anchor, `reply-{id}`: a batch's number, or `clause-{number}` for an article. */
  id: string
  isSettled: boolean
  /** _Úlohy na pozadí_ under an archive that failed (`13c`): the way to the job that retries it. */
  jobsHref: string | null
  /** `Obrazová díla · 2 díla · VDM_2026_5`. */
  kind: string
  menu: { items: ActionMenuItem[]; label: string } | null
  meta: string
  quote: { isClamped: boolean; moreHref: string | null; text: string } | null
  tag: { detail?: string; label: string; tone: StatusTone }
  title: string
  titleHref: string | null
  /** Where _Vrátit_ posts, on the card just decided. */
  undoAction: string | null
}

/**
 * The design system's `.vdm-queue-item` (`13a`, r1oqllvb): what the reply is about, who sent it
 * and when, the reply itself, and what can be done about it. It writes the markup only and leaves
 * the look to `components.css`. Each action is a form, so it works with no script.
 */
export function QueueCard(handle: Handle<{ card: QueueCardView }>) {
  return () => {
    let { card } = handle.props
    /* The buttons say what they do and the card says which reply: a screen reader hears both. */
    let aboutId = `reply-${card.id}-about`
    let openHref = card.answer?.openHref ?? null
    let hasActions =
      card.consentAction !== null ||
      card.undoAction !== null ||
      card.menu !== null ||
      card.jobsHref !== null ||
      openHref !== null

    return (
      <li
        class={card.isSettled ? 'vdm-queue-item vdm-queue-item--settled' : 'vdm-queue-item'}
        id={`reply-${card.id}`}
      >
        <div class="vdm-queue-item__head">
          <div class="vdm-queue-item__about" id={aboutId}>
            <span class="vdm-queue-item__kind">{card.kind}</span>
            {card.titleHref === null ? (
              <span class="vdm-queue-item__title">{card.title}</span>
            ) : (
              <a class="vdm-queue-item__title" href={card.titleHref}>
                {card.title}
              </a>
            )}
            <span class="vdm-queue-item__meta">{card.meta}</span>
          </div>
          <StatusTag detail={card.tag.detail} isOnTint={card.isSettled} tone={card.tag.tone}>
            {card.tag.label}
          </StatusTag>
        </div>
        {card.quote === null ? null : (
          <blockquote
            class={
              card.quote.isClamped
                ? 'vdm-queue-item__quote vdm-queue-item__quote--clamp'
                : 'vdm-queue-item__quote'
            }
          >
            {card.quote.text}
          </blockquote>
        )}
        {card.quote?.moreHref ? (
          <a class="vdm-queue-item__more" href={card.quote.moreHref}>
            {SHOW_WHOLE_REPLY_LABEL}
          </a>
        ) : null}
        {card.answers === null ? null : (
          <details class="vdm-queue-item__sent" open={card.answers.isOpen ? true : undefined}>
            <summary>{card.answers.title}</summary>
            {card.answers.items.map((item) => (
              <div class="vdm-queue-item__reply">
                <span class="vdm-queue-item__reply-meta">
                  {item.meta}
                  {item.line === null ? null : ` · ${item.line}`}
                </span>
                <p class="vdm-queue-item__reply-text">{item.text}</p>
              </div>
            ))}
          </details>
        )}
        {card.callout === null ? null : (
          <Callout tone={card.callout.tone}>
            {card.callout.title === null ? null : (
              <p class="vdm-callout__title">{card.callout.title}</p>
            )}
            {/* Inline, as the other Callouts write it: `css()` would lose to the design system's
                own rules for a paragraph in the body. */}
            <p style={{ margin: 0 }}>{card.callout.text}</p>
          </Callout>
        )}
        {hasActions ? (
          /* The form stands in for this row while it is open, so the card has one main action
             (`13d`); the island hides and shows it again. `hidden` sits on a wrapper, since
             the row's own `display: flex` would win over the attribute. */
          <div
            hidden={card.answer?.isOpen === true ? true : undefined}
            id={`reply-${card.id}-actions`}
          >
            <div class="vdm-queue-item__actions">
              {card.consentAction === null ? null : (
                <form action={card.consentAction} method="post">
                  <CsrfField />
                  <input name="reply" type="hidden" value={card.consentReplyId ?? ''} />
                  <button
                    aria-describedby={aboutId}
                    class="vdm-btn vdm-btn--primary vdm-btn--sm"
                    type="submit"
                  >
                    {CONSENT_LABEL}
                  </button>
                </form>
              )}
              {openHref === null ? null : (
                <a
                  aria-describedby={aboutId}
                  class="vdm-btn vdm-btn--outline vdm-btn--sm"
                  href={openHref}
                  id={`reply-${card.id}-answer`}
                >
                  {ANSWER_LABEL}
                </a>
              )}
              {card.undoAction === null ? null : (
                <form action={card.undoAction} method="post">
                  <CsrfField />
                  <button
                    aria-describedby={aboutId}
                    class="vdm-btn vdm-btn--ghost vdm-btn--sm"
                    type="submit"
                  >
                    {UNDO_LABEL}
                  </button>
                </form>
              )}
              {card.menu === null ? null : (
                <ActionMenu items={card.menu.items} label={card.menu.label} />
              )}
              {card.jobsHref === null ? null : (
                <a class="vdm-btn vdm-btn--outline vdm-btn--sm" href={card.jobsHref}>
                  {JOBS_TITLE}
                </a>
              )}
            </div>
          </div>
        ) : null}
        {card.answer === null ? null : (
          <AnswerCompose {...card.answer} csrfToken={getCsrfToken(getContext())} />
        )}
      </li>
    )
  }
}
