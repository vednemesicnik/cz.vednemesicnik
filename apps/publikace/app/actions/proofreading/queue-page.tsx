import type { Handle } from 'remix/component'
import { css } from 'remix/component'
import { getContext } from 'remix/middleware/async-context'
import { getCsrfToken } from 'remix/middleware/csrf'

import { OPEN_DOCUMENT_LABEL } from '../../domain/article.ts'
import {
  CANCEL_FINAL_LABEL,
  CANCEL_LABEL,
  DIALOG_CANCEL_LABEL,
  type DialogError,
  EMPTY_ACTION_EDITOR,
  EMPTY_TITLE,
  MARK_FINAL_CONFIRM_LABEL,
  MARK_FINAL_DIALOG_CANCEL,
  MARK_FINAL_DIALOG_MAIL,
  MARK_FINAL_DIALOG_TITLE,
  MARK_FINAL_LABEL,
  markFinalButtonLabel,
  markFinalDialogText,
  MARKING_FINAL_LABEL,
  OPEN_PDF_LABEL,
  PROOFREADING_TITLE,
  signaturesLabel,
  TAKE_LABEL,
} from '../../domain/proofreading-queue.ts'
import { tied } from '../../domain/public/typography.ts'
import { UNDO_LABEL } from '../../domain/review.ts'
import { routes } from '../../routes.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { EmptyState } from '../../ui/empty-state/component.tsx'
import { EmptyStateText } from '../../ui/empty-state-text/component.tsx'
import { EmptyStateTitle } from '../../ui/empty-state-title/component.tsx'
import { FinalVersionDialog } from '../../ui/final-version-dialog/component.tsx'
import { Layout } from '../../ui/layout/component.tsx'
import { ListHeader } from '../../ui/list-header/component.tsx'
import { ListHeaderTitle } from '../../ui/list-header-title/component.tsx'
import { NewTabMark } from '../../ui/public/new-tab-mark/component.tsx'
import type { PanelPerson } from '../../ui/panel/component.tsx'
import { ActionMenu, type ActionMenuItem } from '../../ui/public/action-menu/component.tsx'
import { PendingActions } from '../../ui/public/pending-actions/component.tsx'
import { StatusTag, type StatusTone } from '../../ui/status-tag/component.tsx'
import type { ToastMessage } from '../../ui/toast/component.tsx'
import { Document } from '../document.tsx'
import type { DriveStatus } from '../issues/overview-page.tsx'

/** One card of the page Korektura, as the controller lays it out. */
export type ProofreadingCardView = {
  /** Where _Zrušit korekturu_ posts, in „⋯“, or `null` where the viewer may not. */
  cancelAction: string | null
  /** Where _Zrušit finální verzi_ posts, in „⋯“, while it may still be cancelled (`15g`). */
  cancelFinalAction: string | null
  documentUrl: string
  id: number
  isSettled: boolean
  /** `Vydání VDM_2026_5`, as plain text: the issue's detail is not a proofreader's. */
  kind: string
  /** The dialog of _Označit finální verzi…_, the card's primary button on the viewer's take. */
  markFinal: string | null
  /** The same dialog from „⋯“, for an editor-in-chief on somebody else's take (`15f`). */
  markFinalForOther: string | null
  meta: string
  /** The final version's PDF on Drive, once there is one (`15g`). */
  pdfUrl: string | null
  tag: { detail: string; label: string; tone: StatusTone }
  /** _Vzít si korekturu_: primary from _Dopsáno_, outline from _Píše se_ (`15a`). */
  take: { action: string; isPrimary: boolean; shown: 'handedOver' | 'writing' } | null
  title: string
  /** Where _Vrátit_ posts, on the card just taken or cancelled (`15d`). */
  undoAction: string | null
}

export type ProofreadingPartView = {
  cards: readonly ProofreadingCardView[]
  /** The sentence under the heading: _Nic nečeká_ in an empty _Čeká_, or the note of _Píše se_. */
  note: string | null
  title: string
}

/** The dialog of `15f`: where it posts, the way back to the card, and the error it keeps. */
export type FinalDialogView = {
  action: string
  articleName: string
  cancelHref: string
  error: DialogError | null
  /** The signatures the clauses carry, one per author. */
  signatures: readonly string[]
}

export type ProofreadingPageProps = {
  /** The Callout over the parts for a link from the digest whose article is not here (`15e`). */
  callout: { text: string; title: string | null } | null
  /** The dialog of `15f` over the page, which is then inert. */
  dialog: FinalDialogView | null
  driveAccount: { expectedEmail: string; status: DriveStatus }
  /** The empty page, or `null` while any part has a card (`15e`). */
  empty: { hasAction: boolean; text: string } | null
  lead: string
  parts: readonly ProofreadingPartView[]
  person: PanelPerson
  toasts?: readonly ToastMessage[]
}

const headStyle = css({ display: 'flex', flexDirection: 'column', gap: '6px' })

const leadStyle = css({ color: 'var(--text-secondary)', fontSize: '15px', margin: 0 })

/* The measure of `13a`: a card wider than this would make the name a line nobody reads. */
const queueStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '28px',
  maxWidth: '860px',
  width: '100%',
})

const partStyle = css({ display: 'flex', flexDirection: 'column', gap: '12px' })

const countStyle = css({ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '6px' })

const noteStyle = css({ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 })

/**
 * The design system's `.vdm-queue-item` without its quote (`15a`): the issue, the name, the
 * authors by name, the tag of `01a` and the actions. Each action is a form, so it works with no
 * script. The name is text, not a link: _Otevřít dokument_ has its place among the actions.
 */
function ProofreadingCard(handle: Handle<{ card: ProofreadingCardView; csrfToken: string }>) {
  return () => {
    let { card, csrfToken } = handle.props
    /* The buttons say what they do and the card says which article: a screen reader hears both. */
    let aboutId = `article-${card.id}-about`
    /* An editor-in-chief's marking for somebody else stands before the line, the cancel of the
       take after it (`15f`). */
    let menuItems: ActionMenuItem[] = []
    if (card.markFinalForOther !== null) {
      menuItems.push({ href: card.markFinalForOther, isSameTab: true, label: MARK_FINAL_LABEL })
    }
    if (card.cancelAction !== null) {
      if (menuItems.length > 0) menuItems.push({ isSeparator: true })
      menuItems.push({ action: card.cancelAction, csrfToken, label: CANCEL_LABEL })
    }
    if (card.cancelFinalAction !== null) {
      menuItems.push({ action: card.cancelFinalAction, csrfToken, label: CANCEL_FINAL_LABEL })
    }

    return (
      <li
        class={card.isSettled ? 'vdm-queue-item vdm-queue-item--settled' : 'vdm-queue-item'}
        id={`article-${card.id}`}
      >
        <div class="vdm-queue-item__head">
          <div class="vdm-queue-item__about" id={aboutId}>
            <span class="vdm-queue-item__kind">{card.kind}</span>
            <span class="vdm-queue-item__title">{card.title}</span>
            <span class="vdm-queue-item__meta">{card.meta}</span>
          </div>
          <StatusTag detail={card.tag.detail} isOnTint={card.isSettled} tone={card.tag.tone}>
            {card.tag.label}
          </StatusTag>
        </div>
        <div class="vdm-queue-item__actions">
          {card.markFinal === null ? null : (
            <a
              aria-label={markFinalButtonLabel(card.title)}
              class="vdm-btn vdm-btn--primary vdm-btn--sm"
              href={card.markFinal}
            >
              {MARK_FINAL_LABEL}
            </a>
          )}
          {card.take === null ? null : (
            <form action={card.take.action} method="post">
              <CsrfField />
              <input name="shown" type="hidden" value={card.take.shown} />
              {/* The same label while it is sent, so the button keeps its width and the row of
                  buttons does not reflow on a phone (`15d`). */}
              <PendingActions
                accessibleLabel={tied`${TAKE_LABEL}: ${card.title}`}
                emphasis={card.take.isPrimary ? 'primary' : 'outline'}
                label={TAKE_LABEL}
                pendingLabel={TAKE_LABEL}
              />
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
          {card.pdfUrl === null ? null : (
            <a
              aria-describedby={aboutId}
              class="vdm-btn vdm-btn--outline vdm-btn--sm"
              href={card.pdfUrl}
              rel="noopener"
              target="_blank"
            >
              {OPEN_PDF_LABEL}
              <NewTabMark />
            </a>
          )}
          <a
            aria-describedby={aboutId}
            class="vdm-btn vdm-btn--outline vdm-btn--sm"
            href={card.documentUrl}
            rel="noopener"
            target="_blank"
          >
            {OPEN_DOCUMENT_LABEL}
            <NewTabMark />
          </a>
          {menuItems.length === 0 ? null : (
            <ActionMenu items={menuItems} label={tied`Další akce článku ${card.title}`} />
          )}
        </div>
      </li>
    )
  }
}

function Part(handle: Handle<{ csrfToken: string; part: ProofreadingPartView }>) {
  let headingId = `part-${handle.id}`

  return () => {
    let { csrfToken, part } = handle.props
    return (
      <section aria-labelledby={headingId} mix={partStyle}>
        <h2 class="h2" id={headingId} style={{ margin: 0 }}>
          {part.title}
          {part.cards.length === 0 ? null : <span mix={countStyle}>{part.cards.length}</span>}
        </h2>
        {/* Only _Čeká na korekturu_ stands empty, and its sentence is then the part's empty
            state (`15e`); _Ještě se píšou_'s sentence is a note over its cards. */}
        {part.note === null ? null : part.cards.length === 0 ? (
          <EmptyState>
            <EmptyStateText>{part.note}</EmptyStateText>
          </EmptyState>
        ) : (
          <p mix={noteStyle}>{part.note}</p>
        )}
        {part.cards.length === 0 ? null : (
          <ol class="vdm-queue">
            {part.cards.map((card) => (
              <ProofreadingCard card={card} csrfToken={csrfToken} />
            ))}
          </ol>
        )}
      </section>
    )
  }
}

/** `15f`: the dialog of the first marking, over the page. */
function MarkFinalDialog(handle: Handle<{ dialog: FinalDialogView }>) {
  return () => {
    let { dialog } = handle.props
    return (
      <FinalVersionDialog
        action={dialog.action}
        after={[MARK_FINAL_DIALOG_CANCEL]}
        cancel={{ href: dialog.cancelHref, label: DIALOG_CANCEL_LABEL }}
        confirmLabel={MARK_FINAL_CONFIRM_LABEL}
        error={dialog.error}
        lead={[markFinalDialogText(dialog.articleName), MARK_FINAL_DIALOG_MAIL]}
        pendingLabel={MARKING_FINAL_LABEL}
        signatures={{ label: signaturesLabel(dialog.signatures.length), names: dialog.signatures }}
        title={MARK_FINAL_DIALOG_TITLE}
      />
    )
  }
}

/**
 * _Korektura_ (`15a`, `15b`, `15c`, `15e`): one page for both roles and one shape for every width.
 * The parts stand in a fixed order and an empty one is left out, but _Čeká na korekturu_, which is
 * what a proofreader comes for.
 */
export function ProofreadingPage(handle: Handle<ProofreadingPageProps>) {
  return () => {
    let { callout, dialog, driveAccount, empty, lead, parts, person, toasts } = handle.props
    let csrfToken = getCsrfToken(getContext())

    return (
      <Document title={PROOFREADING_TITLE}>
        <Layout
          active="proofreading"
          driveAccount={driveAccount}
          isInert={dialog !== null}
          person={person}
          title={PROOFREADING_TITLE}
          toasts={toasts}
        >
          <div mix={headStyle}>
            <ListHeader>
              <ListHeaderTitle>{PROOFREADING_TITLE}</ListHeaderTitle>
            </ListHeader>
            {empty === null ? <p mix={leadStyle}>{lead}</p> : null}
          </div>
          {callout === null ? null : (
            <Callout tone="info">
              {callout.title === null ? null : <p class="vdm-callout__title">{callout.title}</p>}
              {/* Inline, as the other Callouts write it: `css()` would lose to the design
                  system's own rules for a paragraph in the body. */}
              <p style={{ margin: 0 }}>{callout.text}</p>
            </Callout>
          )}
          {empty === null ? (
            <div mix={queueStyle}>
              {parts.map((part) => (
                <Part csrfToken={csrfToken} part={part} />
              ))}
            </div>
          ) : (
            <EmptyState>
              <EmptyStateTitle>{EMPTY_TITLE}</EmptyStateTitle>
              <EmptyStateText>{empty.text}</EmptyStateText>
              {empty.hasAction ? (
                <a class="vdm-btn vdm-btn--outline vdm-btn--sm" href={routes.home.href()}>
                  {EMPTY_ACTION_EDITOR}
                </a>
              ) : null}
            </EmptyState>
          )}
        </Layout>
        {dialog === null ? null : <MarkFinalDialog dialog={dialog} />}
      </Document>
    )
  }
}
