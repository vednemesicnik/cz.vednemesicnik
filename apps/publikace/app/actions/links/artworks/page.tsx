import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import {
  ANOTHER_BATCH_LABEL,
  type ArtworksMessage,
  CONSENT_CALLOUT_NOTE,
  CONSENT_CALLOUT_TITLE,
  consentCalloutText,
  refusedOnSent,
  SENT_TITLE,
  sentArtworkLine,
  sentLead,
} from '../../../domain/artwork.ts'
import {
  articleBadge,
  ARTWORKS_DISCONNECTED_WARNING,
  type ArtworkFieldError,
  ARTWORKS_PAGE_LEAD,
  ARTWORKS_PAGE_TITLE,
} from '../../../domain/public/artwork-form.ts'
import { Callout } from '../../../ui/callout/component.tsx'
import { LinkPage, type LinkPreview } from '../../../ui/link-page/component.tsx'
import type { PageWarning } from '../article-page.tsx'
import { ArrivalHeading } from '../public/arrival-heading.tsx'
import {
  type ArtworkCard,
  ArtworksForm,
  MESSAGE_ID,
  PROVIDER_EMAIL_FIELD,
  PROVIDER_NAME_FIELD,
} from './public/artworks-form.tsx'

export type ArtworksFormPageProps = {
  action: string
  articleName: string
  cards: readonly ArtworkCard[]
  errors: readonly ArtworkFieldError[]
  formKey: string
  isClosed: boolean
  /** The answer to a send that did not go, above the form (`21d`). */
  message?: ArtworksMessage
  /**
   * New on every answer to a send that met something, so the island focuses what stands above the
   * form even when the same sentence comes twice; `undefined` when the page only opened.
   */
  messageKey?: string
  preview: LinkPreview
  provider: { email: string; name: string }
  uploadAction: string
  warning?: PageWarning
}

export type ArtworksSentPageProps = {
  action: string
  articleName: string
  artworks: readonly { author: string | null; name: string; source: string | null }[]
  /** The Mailer refused the request for good: the editors-in-chief take it from here (`21d`). */
  isRefused: boolean
  preview: LinkPreview
  provider: { email: string; name: string }
}

const titleStyle = css({ display: 'flex', flexDirection: 'column', gap: '10px' })

const leadStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '16px',
  lineHeight: 1.5,
  margin: 0,
})

const doneMarkStyle = css({
  alignItems: 'center',
  background: 'var(--bg-success)',
  borderRadius: '999px',
  color: 'var(--text-success)',
  display: 'inline-flex',
  height: '44px',
  justifyContent: 'center',
  width: '44px',
})

const listStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  listStyle: 'none',
  margin: 0,
  padding: 0,
  '& b': { display: 'block', fontSize: '14px', fontWeight: 600, overflowWrap: 'anywhere' },
  '& small': { color: 'var(--text-secondary)', display: 'block', fontSize: '13px' },
})

function Heading(handle: Handle<{ articleName: string }>) {
  return () => (
    <div mix={titleStyle}>
      <span>
        <span class="vdm-badge vdm-badge--emerald">{articleBadge(handle.props.articleName)}</span>
      </span>
      <h1 class="vdm-page-title" style={{ margin: 0 }}>
        {ARTWORKS_PAGE_TITLE}
      </h1>
      <p mix={leadStyle}>{ARTWORKS_PAGE_LEAD}</p>
    </div>
  )
}

/** `21a`, `21b`, `21d`: the form, with what stands in the way above it. */
export function ArtworksFormPage(handle: Handle<ArtworksFormPageProps>) {
  return () => {
    let props = handle.props
    return (
      <LinkPage preview={props.preview} title={ARTWORKS_PAGE_TITLE}>
        <Heading articleName={props.articleName} />
        {/* A missing folder's warning is the island's, which takes it away once an upload gets
            through; the disconnected account's stays as the server drew it. */}
        {props.warning !== 'disconnected' ? null : props.message === undefined &&
          props.messageKey !== undefined ? (
          /* A send that met the warning has no other message: the warning is what to focus. */
          <div id={MESSAGE_ID} role="alert" tabIndex={-1}>
            <Callout tone="warning">{ARTWORKS_DISCONNECTED_WARNING}</Callout>
          </div>
        ) : (
          <Callout tone="warning">{ARTWORKS_DISCONNECTED_WARNING}</Callout>
        )}
        {props.message === undefined ? null : (
          <div id={MESSAGE_ID} role="alert" tabIndex={-1}>
            <Callout tone="error">
              <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                {props.message.title}
              </p>
              <p style={{ margin: 0 }}>{props.message.text}</p>
            </Callout>
          </div>
        )}
        <ArtworksForm
          action={props.action}
          cards={props.cards}
          errors={props.errors}
          formKey={props.formKey}
          isClosed={props.isClosed || props.warning === 'disconnected'}
          isFolderGone={props.warning === 'folder-gone'}
          messageKey={props.messageKey ?? null}
          provider={props.provider}
          uploadAction={props.uploadAction}
        />
      </LinkPage>
    )
  }
}

/**
 * `21c`: the batch is in. The request's Callout only when the request went; when the Mailer refused
 * it for good, the page says who takes it from here instead (`21d`).
 */
export function ArtworksSentPage(handle: Handle<ArtworksSentPageProps>) {
  return () => {
    let { action, articleName, artworks, isRefused, preview, provider } = handle.props
    let refused = refusedOnSent(provider.email)
    return (
      <LinkPage preview={preview} title={SENT_TITLE}>
        <div mix={titleStyle}>
          <span aria-hidden="true" mix={doneMarkStyle}>
            <svg
              fill="none"
              height="22"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              width="22"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <ArrivalHeading text={SENT_TITLE} />
          <p mix={leadStyle}>{sentLead(artworks.length, articleName)}</p>
        </div>
        {isRefused ? (
          <Callout tone="warning">
            <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
              {refused.title}
            </p>
            <p style={{ margin: 0 }}>{refused.text}</p>
          </Callout>
        ) : (
          <Callout tone="info">
            <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
              {CONSENT_CALLOUT_TITLE}
            </p>
            <p style={{ margin: '0 0 8px' }}>{consentCalloutText(provider.email)}</p>
            <p style={{ margin: 0 }}>{CONSENT_CALLOUT_NOTE}</p>
          </Callout>
        )}
        <ul mix={listStyle}>
          {artworks.map((artwork, index) => (
            <li key={index}>
              <b>{artwork.name}</b>
              <small>{sentArtworkLine(artwork.author, artwork.source)}</small>
            </li>
          ))}
        </ul>
        <form action={action} method="post">
          <input name="intent" type="hidden" value="another" />
          <input name={PROVIDER_NAME_FIELD} type="hidden" value={provider.name} />
          <input name={PROVIDER_EMAIL_FIELD} type="hidden" value={provider.email} />
          <button class="vdm-btn vdm-btn--outline vdm-btn--lg vdm-btn--full-width" type="submit">
            {ANOTHER_BATCH_LABEL}
          </button>
        </form>
      </LinkPage>
    )
  }
}
