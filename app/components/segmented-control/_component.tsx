import type { ChangeEvent } from 'react'
import { useId } from 'react'

import styles from './_styles.module.css'

type Option = {
  label: string
  value: string
  lang?: string
}

type Props = {
  legend: string
  name: string
  options: Option[]
  value: string
  hint?: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

/**
 * One choice of a few, drawn as joined segments (design 29a, a candidate the
 * design system does not have yet). Native radio buttons, so the arrow keys
 * move the choice and a form submits it under `name`.
 *
 * @param props.legend - The visible name of the choice (e.g. „Režim“).
 * @param props.hint - A note under the segments, read with the group.
 */
export const SegmentedControl = ({
  hint,
  legend,
  name,
  onChange,
  options,
  value,
}: Props) => {
  const hintId = useId()

  return (
    <fieldset
      aria-describedby={hint === undefined ? undefined : hintId}
      className={styles.fieldset}
    >
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.track}>
        {options.map((option) => (
          <label
            className={styles.segment}
            key={option.value}
            lang={option.lang}
          >
            <input
              checked={option.value === value}
              className={styles.input}
              name={name}
              onChange={onChange}
              type={'radio'}
              value={option.value}
            />
            {option.label}
          </label>
        ))}
      </div>
      {hint !== undefined && (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      )}
    </fieldset>
  )
}
