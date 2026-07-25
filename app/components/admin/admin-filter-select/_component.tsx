import { clsx } from 'clsx'
import { type ChangeEvent, type ComponentProps, useId } from 'react'

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
  id,
  className,
  onChange,
  ...rest
}: Props) => {
  const generatedId = useId()
  const selectId = id ?? generatedId

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
        id={selectId}
        onChange={handleChange}
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
