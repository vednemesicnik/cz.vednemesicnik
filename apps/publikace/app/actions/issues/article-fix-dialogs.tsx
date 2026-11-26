import type { Handle } from 'remix/component'
import { css } from 'remix/component'
import { getContext } from 'remix/middleware/async-context'
import { getCsrfToken } from 'remix/middleware/csrf'

import {
  EDIT_AUTHORS_TITLE,
  REMOVE_ARTICLE_CONFIRM_LABEL,
  REMOVE_ARTICLE_TITLE,
  RENAME_ARTICLE_CONFIRM_LABEL,
  RENAME_ARTICLE_PENDING_LABEL,
  RENAME_ARTICLE_TEXT,
  RENAME_ARTICLE_TITLE,
} from '../../domain/article-fixes.ts'
import { ARTICLE_NAME_LABEL } from '../../domain/article.ts'
import type { FixCallout } from '../../domain/issue-fixes.ts'
import { CsrfField } from '../../ui/csrf-field/component.tsx'
import { Dialog } from '../../ui/dialog/component.tsx'
import { DialogTitle } from '../../ui/dialog-title/component.tsx'
import { PendingActions } from '../../ui/public/pending-actions/component.tsx'
import { SelectedField } from '../../ui/public/selected-field/component.tsx'
import { FixCalloutView } from './issue-parts.tsx'
import { AuthorsForm, type AuthorsFormProps } from './public/authors-form.tsx'

/**
 * _Přejmenovat článek_ (`12x`) over the detail: where it is sent and where _Zrušit_ leads, the
 * name in the field as typed, and the name the dialog showed, which the answer checks.
 */
export type RenameArticleView = {
  action: string
  callout?: FixCallout
  cancelHref: string
  fieldError?: string
  name: string
  shownName: string
}

/** _Upravit autory_ (`12y`) over the detail: the island's props but the token, read here. */
export type EditAuthorsView = Omit<AuthorsFormProps, 'csrfToken'>

/** _Odebrat článek_ (`12z`) over the detail: its paragraphs, and a Callout once Drive refused. */
export type RemoveArticleView = {
  action: string
  callout?: FixCallout
  cancelHref: string
  paragraphs: readonly string[]
}

export type ArticleFixView =
  | ({ kind: 'rename' } & RenameArticleView)
  | ({ kind: 'authors' } & EditAuthorsView)
  | ({ kind: 'remove' } & RemoveArticleView)

/* The form holds the body and the actions, so the field goes with the button while the dialog's
   own gaps still fall between them. */
const dialogFormStyle = css({ display: 'contents' })

export function ArticleFixDialog(handle: Handle<{ view: ArticleFixView }>) {
  return () => {
    let { view } = handle.props
    if (view.kind === 'rename') return <RenameArticleDialog view={view} />
    if (view.kind === 'remove') return <RemoveArticleDialog view={view} />
    let { kind: _kind, ...form } = view
    return (
      <Dialog maxWidth="540px">
        <DialogTitle>{EDIT_AUTHORS_TITLE}</DialogTitle>
        <AuthorsForm {...form} csrfToken={getCsrfToken(getContext())} />
      </Dialog>
    )
  }
}

/**
 * `12x`: the field and the messages of `20b`. Nothing is sent, and the Doc's text stays as it is,
 * which the dialog says before the step.
 */
function RenameArticleDialog(handle: Handle<{ view: RenameArticleView }>) {
  return () => {
    let { action, callout, cancelHref, fieldError, name, shownName } = handle.props.view
    let [first, second] = RENAME_ARTICLE_TEXT
    return (
      <Dialog maxWidth="480px">
        <DialogTitle>{RENAME_ARTICLE_TITLE}</DialogTitle>
        <form action={action} method="post" mix={dialogFormStyle} noValidate>
          <CsrfField />
          <input name="shownName" type="hidden" value={shownName} />
          <div class="vdm-dialog__body">
            {callout === undefined ? null : <FixCalloutView callout={callout} />}
            <p class="vdm-dialog__text">{first}</p>
            <p class="vdm-dialog__text">{second}</p>
            <SelectedField error={fieldError} label={ARTICLE_NAME_LABEL} name="name" value={name} />
          </div>
          <div class="vdm-dialog__actions">
            <PendingActions
              cancel={{ href: cancelHref, label: 'Zrušit' }}
              emphasis="primary"
              label={RENAME_ARTICLE_CONFIRM_LABEL}
              pendingLabel={RENAME_ARTICLE_PENDING_LABEL}
            />
          </div>
        </form>
      </Dialog>
    )
  }
}

/**
 * `12z`: red only in the button, as `12w`; the article is not named in the title, since the row
 * stands under the dialog and the first paragraph names it. Focus starts on the way back, so Enter
 * on arrival never removes anything.
 */
function RemoveArticleDialog(handle: Handle<{ view: RemoveArticleView }>) {
  return () => {
    let { action, callout, cancelHref, paragraphs } = handle.props.view
    return (
      <Dialog maxWidth="480px">
        <DialogTitle>{REMOVE_ARTICLE_TITLE}</DialogTitle>
        <div class="vdm-dialog__body">
          {callout === undefined ? null : <FixCalloutView callout={callout} />}
          {paragraphs.map((paragraph) => (
            <p class="vdm-dialog__text">{paragraph}</p>
          ))}
        </div>
        <form action={action} class="vdm-dialog__actions" method="post">
          <CsrfField />
          <a autofocus class="vdm-btn vdm-btn--ghost vdm-btn--sm" href={cancelHref}>
            Zrušit
          </a>
          <button class="vdm-btn vdm-btn--danger vdm-btn--sm" type="submit">
            {REMOVE_ARTICLE_CONFIRM_LABEL}
          </button>
        </form>
      </Dialog>
    )
  }
}
