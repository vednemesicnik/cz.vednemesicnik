import { type FieldMetadata, getInputProps } from '@conform-to/react'
import { type FormEvent, useRef, useState } from 'react'

import { ButtonLink } from '~/components/button-link'
import { ReorderableListHandle } from '~/components/reorderable-list-handle'
import { TextField } from '~/components/text-field'

import { getFollowedLinkLabel } from '../../../../utils/get-followed-link-label'
import {
  getLinkLabelState,
  type LinkLabelState,
} from '../../../../utils/get-link-label-state'
import styles from './_styles.module.css'

type LinkValue = {
  label?: string
  url?: string
}

type Props = {
  field: FieldMetadata<LinkValue>
  index: number
  count: number
  /** The hold is gone for good: nothing to remove (24h). */
  isReadOnly: boolean
  /** Fills the label as its address says, without a save of its own. */
  onLabelChange: (name: string, value: string) => void
  onRemove: () => void
}

// The line under the label (design 27d, copy w59y90od, li7oq1zu).
const LABEL_HINT: Record<NonNullable<LinkLabelState>, string> = {
  filled: 'Doplněno podle adresy.',
  manual: 'Změněno ručně.',
  missing: 'Doplňte název platformy.',
}

/**
 * One link of the episode (design 27d, 2o0uwhgp): its handle, the platform's
 * name and the address, and *Odebrat*. The name follows the address until
 * changed by hand. A valid address the editor doesn't know asks for the name
 * at once, a description, not an error, and a pasted one moves the focus to
 * the empty name. Where the name came from shows while the row is being
 * worked on; the request for a name always.
 */
export const EpisodeLinkRow = ({
  field,
  index,
  count,
  isReadOnly,
  onLabelChange,
  onRemove,
}: Props) => {
  const { label, url } = field.getFieldset()
  const labelRef = useRef<HTMLInputElement>(null)
  // The address the label followed last, for the next change of it.
  const previousUrlRef = useRef(url.value ?? '')
  const [isFocused, setIsFocused] = useState(false)

  const labelValue = label.value ?? ''
  const urlValue = url.value ?? ''
  const name = labelValue.trim()
  const labelState = getLinkLabelState({ label: labelValue, url: urlValue })
  // An invalid address has its error, which says enough (2o0uwhgp).
  const hint =
    labelState === 'missing' || (labelState !== null && isFocused)
      ? LABEL_HINT[labelState]
      : undefined

  const handleUrlInput = (event: FormEvent<HTMLInputElement>) => {
    const nextUrl = event.currentTarget.value
    const currentLabel = labelRef.current?.value ?? labelValue
    const nextLabel = getFollowedLinkLabel({
      label: currentLabel,
      previousUrl: previousUrlRef.current,
      url: nextUrl,
    })
    previousUrlRef.current = nextUrl
    if (nextLabel !== currentLabel) onLabelChange(label.name, nextLabel)

    // A pasted address of another platform: the name is the next thing to
    // write (27d).
    if (
      (event.nativeEvent as InputEvent).inputType === 'insertFromPaste' &&
      nextLabel === '' &&
      getLinkLabelState({ label: '', url: nextUrl }) === 'missing'
    ) {
      labelRef.current?.focus()
    }
  }

  return (
    <div
      className={styles.row}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false)
        }
      }}
      onFocusCapture={() => setIsFocused(true)}
    >
      <ReorderableListHandle
        className={styles.handle}
        label={
          name === ''
            ? `Přesunout odkaz bez názvu. Pozice ${index + 1}, celkem ${count}.`
            : `Přesunout odkaz: ${name}. Pozice ${index + 1}, celkem ${count}.`
        }
      />
      <TextField
        {...getInputProps(label, { type: 'text' })}
        errors={label.errors}
        hint={hint}
        isLabelHidden
        label={'Název platformy'}
        ref={labelRef}
      />
      <TextField
        {...getInputProps(url, { type: 'text' })}
        className={styles.urlField}
        data-link-url={true}
        errors={url.errors}
        inputMode={'url'}
        isLabelHidden
        // Not the episode's own Adresa beside it (copy 0s5hhaqz).
        label={'Adresa odkazu'}
        onInput={handleUrlInput}
      />
      {!isReadOnly && (
        <ButtonLink className={styles.remove} onClick={onRemove}>
          Odebrat
        </ButtonLink>
      )}
    </div>
  )
}
