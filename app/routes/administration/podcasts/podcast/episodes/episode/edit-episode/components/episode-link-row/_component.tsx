import { type FieldMetadata, getInputProps } from '@conform-to/react'
import { type FormEvent, useRef } from 'react'

import { ActionMenu } from '~/components/action-menu'
import { ActionMenuItem } from '~/components/action-menu-item'
import { ReorderableListHandle } from '~/components/reorderable-list-handle'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldHint } from '~/components/text-field-hint'
import { TextFieldLabel } from '~/components/text-field-label'
import { getOrderMenuItems } from '~/utils/get-order-menu-items'
import { useFocusWithin } from '~/utils/use-focus-within'

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
  /** Moves the row without dragging, from its „⋯“ (91abjimg). */
  onMove: (target: number) => void
  onRemove: () => void
}

// The line under the label (design 27d, copy w59y90od, li7oq1zu).
const LABEL_HINT: Record<NonNullable<LinkLabelState>, string> = {
  filled: 'Doplněno podle adresy.',
  manual: 'Změněno ručně.',
  missing: 'Doplňte název platformy.',
}

/**
 * One link of the episode (design 27d, 2o0uwhgp, 91abjimg): its handle, the
 * platform's name and the address, and a „⋯“ that moves the row without
 * dragging and removes it. The name follows the address until changed by
 * hand. A valid address the editor doesn't know asks for the name at once, a
 * description, not an error, and a pasted one moves the focus to the empty
 * name. A name filled from the address says so while the row is being worked
 * on; one changed by hand and the request for a name always (1iqapiz2).
 */
export const EpisodeLinkRow = ({
  field,
  index,
  count,
  isReadOnly,
  onLabelChange,
  onMove,
  onRemove,
}: Props) => {
  const { label, url } = field.getFieldset()
  const labelRef = useRef<HTMLInputElement>(null)
  // The address the label followed last, for the next change of it.
  const previousUrlRef = useRef(url.value ?? '')
  // A press that takes the focus away hides the sentence only when it ends,
  // so the rows under it don't move under the pointer.
  const { isFocusWithin, onBlurCapture, onFocusCapture } = useFocusWithin()

  const labelValue = label.value ?? ''
  const urlValue = url.value ?? ''
  const name = labelValue.trim()
  const labelState = getLinkLabelState({ label: labelValue, url: urlValue })
  // An invalid address has its error, which says enough (2o0uwhgp).
  const hint =
    labelState === 'missing' ||
    labelState === 'manual' ||
    (labelState === 'filled' && isFocusWithin)
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
      onBlurCapture={onBlurCapture}
      onFocusCapture={onFocusCapture}
    >
      <ReorderableListHandle
        className={styles.handle}
        label={
          name === ''
            ? `Přesunout odkaz bez názvu. Pozice ${index + 1}, celkem ${count}.`
            : `Přesunout odkaz: ${name}. Pozice ${index + 1}, celkem ${count}.`
        }
      />
      <TextField errors={label.errors} id={label.id} required={label.required}>
        <TextFieldLabel isVisuallyHidden>Název platformy</TextFieldLabel>
        <TextFieldControl
          {...getInputProps(label, { type: 'text' })}
          ref={labelRef}
        />
        {hint !== undefined && <TextFieldHint>{hint}</TextFieldHint>}
      </TextField>
      <TextField
        className={styles.urlField}
        errors={url.errors}
        id={url.id}
        required={url.required}
      >
        {/* Not the episode's own Adresa beside it (copy 0s5hhaqz). */}
        <TextFieldLabel isVisuallyHidden>Adresa odkazu</TextFieldLabel>
        <TextFieldControl
          {...getInputProps(url, { type: 'text' })}
          data-link-url={true}
          inputMode={'url'}
          onInput={handleUrlInput}
        />
      </TextField>
      {/* The moves of 22c, then Odebrat; read-only, no „⋯“ (copy 25ayrk1j). */}
      <ActionMenu
        className={styles.menu}
        label={
          name === ''
            ? 'Další akce odkazu bez názvu'
            : `Další akce odkazu: ${name}`
        }
        size={'sm'}
      >
        {!isReadOnly && (
          <>
            {getOrderMenuItems(index, count, onMove).map((item) => (
              <ActionMenuItem key={item.label} onSelect={item.onSelect}>
                {item.label}
              </ActionMenuItem>
            ))}
            <ActionMenuItem danger={true} onSelect={onRemove}>
              Odebrat
            </ActionMenuItem>
          </>
        )}
      </ActionMenu>
    </div>
  )
}
