import { type FieldName, useField } from '@conform-to/react'
import { useEffect, useRef } from 'react'

import { ButtonLink } from '~/components/button-link'
import { ReorderableList } from '~/components/reorderable-list'

import { EpisodeLinkRow } from '../episode-link-row'
import styles from './_styles.module.css'

type LinkValue = {
  label?: string
  url?: string
}

type Props = {
  name: FieldName<LinkValue[] | undefined>
  /** The hold is gone for good: nothing to add or remove (24h). */
  isReadOnly: boolean
}

/**
 * *Odkazy na epizodu* in the episode editor (design 27d): the links in the
 * order the web lists them, dragged by their handles into another, with
 * *Přidat odkaz* under them. A new row takes the focus in its address, which
 * is pasted first; the name follows from it.
 */
export const EpisodeLinks = ({ name, isReadOnly }: Props) => {
  const [field, form] = useField(name)
  const rows = field.getFieldList()
  const items = rows.map((row) => ({ id: row.key ?? row.id, row }))
  const listRef = useRef<HTMLDivElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)
  // What the last change of the list asks the focus to do.
  const focusAfterChangeRef = useRef<'new-row' | 'add' | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when a row comes or goes
  useEffect(() => {
    const target = focusAfterChangeRef.current
    if (target === null) return
    focusAfterChangeRef.current = null
    if (target === 'add') {
      addRef.current?.focus()
      return
    }
    const urlInputs =
      listRef.current?.querySelectorAll<HTMLInputElement>('[data-link-url]')
    urlInputs?.[urlInputs.length - 1]?.focus()
  }, [rows.length])

  return (
    <div className={styles.links} ref={listRef}>
      <ReorderableList
        dragArea={'handle'}
        getName={({ row }) => {
          const label = row.getFieldset().label.value?.trim() ?? ''
          return label === '' ? 'Odkaz bez názvu' : label
        }}
        instruction={
          'Mezerníkem odkaz zvednete i položíte, šipkami nahoru a dolů posunete a klávesou Escape přesun zrušíte.'
        }
        items={items}
        onReorder={(from, to) => form.reorder({ from, name, to })}
      >
        {({ item: { row }, index, count }) => (
          <EpisodeLinkRow
            count={count}
            field={row}
            index={index}
            isReadOnly={isReadOnly}
            onLabelChange={(labelName, value) =>
              form.update({ name: labelName, value })
            }
            onRemove={() => {
              focusAfterChangeRef.current = 'add'
              form.remove({ index, name })
            }}
          />
        )}
      </ReorderableList>
      {!isReadOnly && (
        <ButtonLink
          className={styles.add}
          onClick={() => {
            focusAfterChangeRef.current = 'new-row'
            form.insert({ name })
          }}
          ref={addRef}
        >
          Přidat odkaz
        </ButtonLink>
      )}
    </div>
  )
}
