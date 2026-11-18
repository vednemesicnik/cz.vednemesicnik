import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import {
  ACCOUNT_DISCONNECTED_WARNING,
  ALL_WELCOMES_SENT,
  ANOTHER_ARTICLE_LABEL,
  ARTICLE_PAGE_LEAD,
  ARTICLE_PAGE_TITLE,
  ARTICLES_FOLDER_GONE_WARNING,
  type AuthorInput,
  CREATED_TITLE,
  createdLead,
  type FieldError,
  issueLine,
  OPEN_DOCUMENT_LABEL,
  type SubmitMessage,
  UPLOAD_ARTWORKS_LABEL,
  WHAT_NEXT_STEPS,
  WHAT_NEXT_TITLE,
} from '../../domain/article.ts'
import { Callout } from '../../ui/callout/component.tsx'
import { LinkPage, type LinkPreview } from '../../ui/link-page/component.tsx'
import { ArticleForm, MESSAGE_ID } from './public/article-form.tsx'
import { ArrivalHeading } from './public/arrival-heading.tsx'

/** Why the page cannot create an article right now, said under the lead when it opens (`20a`). */
export type PageWarning = 'disconnected' | 'folder-gone'

export type ArticleFormPageProps = {
  action: string
  authors: readonly AuthorInput[]
  errors: readonly FieldError[]
  formKey: string
  isClosed: boolean
  issueName: string
  /** The answer to a send that did not create the article, above the form (`20c`). */
  message?: SubmitMessage
  /** Set on an answer to a send, so the island focuses what stands above the form. */
  messageKey?: string
  name: string
  preview: LinkPreview
  warning?: PageWarning
}

export type ArticleCreatedPageProps = {
  anotherHref: string
  articleName: string
  artworksUrl: string
  documentUrl: string
  isEveryWelcomeSent: boolean
  issueName: string
  preview: LinkPreview
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

const nextStyle = css({
  borderTop: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  paddingTop: '20px',
  '& h2': { fontSize: '16px', fontWeight: 600, margin: 0 },
  '& ol': {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '15px',
    gap: '8px',
    lineHeight: 1.5,
    margin: 0,
    paddingLeft: '20px',
  },
})

const anotherStyle = css({
  alignItems: 'center',
  alignSelf: 'flex-start',
  display: 'inline-flex',
  fontSize: '15px',
  minHeight: '44px',
})

function warningText(warning: PageWarning): string {
  return warning === 'disconnected' ? ACCOUNT_DISCONNECTED_WARNING : ARTICLES_FOLDER_GONE_WARNING
}

/** `20a`–`20c`: the form, with what stands in the way above it. */
export function ArticleFormPage(handle: Handle<ArticleFormPageProps>) {
  return () => {
    let {
      action,
      authors,
      errors,
      formKey,
      isClosed,
      issueName,
      message,
      messageKey,
      name,
      preview,
      warning,
    } = handle.props

    return (
      <LinkPage preview={preview} title={ARTICLE_PAGE_TITLE}>
        <div mix={titleStyle}>
          <span>
            <span class="vdm-badge vdm-badge--violet">{issueLine(issueName)}</span>
          </span>
          <h1 class="vdm-page-title" style={{ margin: 0 }}>
            {ARTICLE_PAGE_TITLE}
          </h1>
          <p mix={leadStyle}>{ARTICLE_PAGE_LEAD}</p>
        </div>
        {warning === undefined ? null : message === undefined && messageKey !== undefined ? (
          /* A send that met the warning has no other message: the warning is what to focus. */
          <div id={MESSAGE_ID} role="alert" tabIndex={-1}>
            <Callout tone="warning">{warningText(warning)}</Callout>
          </div>
        ) : (
          <Callout tone="warning">{warningText(warning)}</Callout>
        )}
        {message === undefined ? null : (
          <div id={MESSAGE_ID} role="alert" tabIndex={-1}>
            <Callout tone="error">
              <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                {message.title}
              </p>
              <p style={{ margin: 0 }}>{message.text}</p>
            </Callout>
          </div>
        )}
        <ArticleForm
          action={action}
          authors={authors}
          errors={errors}
          formKey={formKey}
          isClosed={isClosed}
          messageKey={messageKey ?? null}
          name={name}
        />
      </LinkPage>
    )
  }
}

/** `20d`: the article exists. The e-mail sentence stands only when it is true for every author. */
export function ArticleCreatedPage(handle: Handle<ArticleCreatedPageProps>) {
  return () => {
    let {
      anotherHref,
      articleName,
      artworksUrl,
      documentUrl,
      isEveryWelcomeSent,
      issueName,
      preview,
    } = handle.props

    return (
      <LinkPage preview={preview} title={CREATED_TITLE}>
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
          <ArrivalHeading text={CREATED_TITLE} />
          <p mix={leadStyle}>
            {createdLead(articleName, issueName)}
            {isEveryWelcomeSent ? ` ${ALL_WELCOMES_SENT}` : null}
          </p>
        </div>
        <a class="vdm-btn vdm-btn--primary vdm-btn--lg vdm-btn--full-width" href={documentUrl}>
          {OPEN_DOCUMENT_LABEL}
        </a>
        {artworksUrl === '' ? null : (
          <a class="vdm-btn vdm-btn--outline vdm-btn--lg vdm-btn--full-width" href={artworksUrl}>
            {UPLOAD_ARTWORKS_LABEL}
          </a>
        )}
        <section aria-labelledby="what-next" mix={nextStyle}>
          <h2 id="what-next">{WHAT_NEXT_TITLE}</h2>
          <ol>
            {WHAT_NEXT_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <a href={anotherHref} mix={anotherStyle}>
          {ANOTHER_ARTICLE_LABEL}
        </a>
      </LinkPage>
    )
  }
}
