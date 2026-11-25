import type { Handle } from 'remix/component'
import { css } from 'remix/component'

import { Callout } from '../callout/component.tsx'
import { CsrfField } from '../csrf-field/component.tsx'
import { Dialog } from '../dialog/component.tsx'
import { DialogTitle } from '../dialog-title/component.tsx'
import { PendingActions } from '../public/pending-actions/component.tsx'

export type FinalVersionDialogProps = {
  action: string
  /** The paragraphs under the names, in the order the dialog's consequences come. */
  after: readonly string[]
  cancel: { href: string; label: string }
  confirmLabel: string
  /** A Callout of what stopped the step, which stays in the dialog to be tried again (`11c`). */
  error: { text: string; title: string } | null
  /** The paragraphs over the names: what is stored, and who is asked. */
  lead: readonly string[]
  pendingLabel: string
  /** The signatures the clauses carry, one per author, under their label. */
  signatures: { label: string; names: readonly string[] }
  title: string
}

/* One name per cell, at least 140 px wide: ten authors stay within the dialog's height on a
   phone, where one per line would push it past a messenger's window (`15f`). */
const signaturesStyle = css({
  display: 'grid',
  gap: '4px 12px',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  listStyle: 'none',
  margin: 0,
  padding: 0,
})

const signaturesLabelStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '13px',
  margin: '0 0 4px',
})

/**
 * The dialog of a final version (`15f`, `12r`): marking sends e-mails to people outside the
 * newsroom, and the way back lasts only until a run of the job takes the clauses, so it is asked
 * first. Focus starts on the way back, and while it saves, both controls lock.
 */
export function FinalVersionDialog(handle: Handle<FinalVersionDialogProps>) {
  return () => {
    let { action, after, cancel, confirmLabel, error, lead, pendingLabel, signatures, title } =
      handle.props
    return (
      <Dialog maxWidth="460px">
        <DialogTitle>{title}</DialogTitle>
        <div class="vdm-dialog__body">
          {error === null ? null : (
            <div role="alert">
              <Callout tone="error">
                <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                  {error.title}
                </p>
                <p style={{ margin: 0 }}>{error.text}</p>
              </Callout>
            </div>
          )}
          {lead.map((text) => (
            <p class="vdm-dialog__text">{text}</p>
          ))}
          <div>
            <p mix={signaturesLabelStyle}>{signatures.label}</p>
            <ul mix={signaturesStyle}>
              {signatures.names.map((name) => (
                <li>{`„${name}“`}</li>
              ))}
            </ul>
          </div>
          {after.map((text) => (
            <p class="vdm-dialog__text">{text}</p>
          ))}
        </div>
        <form action={action} class="vdm-dialog__actions" method="post">
          <CsrfField />
          <PendingActions
            cancel={{ ...cancel, hasFocus: true }}
            emphasis="primary"
            label={confirmLabel}
            pendingLabel={pendingLabel}
          />
        </form>
      </Dialog>
    )
  }
}
