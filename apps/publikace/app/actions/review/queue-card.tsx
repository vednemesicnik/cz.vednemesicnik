import type { Handle } from 'remix/component'

import { JOBS_TITLE } from '../../domain/jobs.ts'
import { CONSENT_LABEL, SHOW_WHOLE_REPLY_LABEL, UNDO_LABEL } from '../../domain/review.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { ActionMenu, type ActionMenuItem } from '../../ui/public/action-menu/component.tsx'
import { StatusTag, type StatusTone } from '../../ui/status-tag/component.tsx'

/** One card of _Ke kontrole_, as the controller lays it out. */
export type QueueCardView = {
  callout: { text: string; title: string | null; tone: 'error' | 'info' } | null
  /** Where _Je to souhlas_ posts, or `null` where the card offers no decision. */
  consentAction: string | null
  /** The reply _Je to souhlas_ confirms, so a newer one that came meanwhile is not. */
  consentReplyId: string | null
  id: number
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
    let hasActions =
      card.consentAction !== null ||
      card.undoAction !== null ||
      card.menu !== null ||
      card.jobsHref !== null

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
        ) : null}
      </li>
    )
  }
}
