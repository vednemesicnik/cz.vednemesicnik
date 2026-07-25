import { clsx } from 'clsx'
import {
  type ChangeEvent,
  type ComponentProps,
  useEffect,
  useId,
  useRef,
} from 'react'

import styles from './_styles.module.css'

type Option = {
  value: string
  label: string
}

// `children` is omitted: the component owns the options, including the leading
// empty one, so a passed child would be silently dropped.
type Props = Omit<ComponentProps<'select'>, 'children'> & {
  label: string
  options: Option[]
}

export const AdminFilterSelect = ({
  label,
  options,
  defaultValue,
  id,
  className,
  onChange,
  ...rest
}: Props) => {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const selectRef = useRef<HTMLSelectElement>(null)

  // The select is uncontrolled, so React writes `defaultValue` into the DOM on
  // mount only — applying a saved filter, clearing one, or going back navigates
  // client-side without remounting and would leave the previous option shown.
  // Resynced by hand rather than through a `key`, which would remount the select
  // and drop focus right after its own auto-submit.
  useEffect(() => {
    const select = selectRef.current

    if (select === null) return

    const value = String(defaultValue ?? '')

    if (select.value !== value) {
      select.value = value
    }
  }, [defaultValue])

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event)
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <section className={styles.container}>
      {/* A plain label instead of `~/components/label`: that one is unlayered, so
          its stacked-form styles cannot be overridden for this inline toolbar. */}
      <label className={styles.label} htmlFor={selectId}>
        {label}
      </label>
      <select
        className={clsx(styles.select, className)}
        defaultValue={defaultValue}
        id={selectId}
        onChange={handleChange}
        ref={selectRef}
        {...rest}
      >
        {/* Empty value = filter off; parsing and serialization both drop it. */}
        <option value={''}>Vše</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </section>
  )
}
