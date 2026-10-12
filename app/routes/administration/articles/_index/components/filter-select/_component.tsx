import { type ChangeEvent, useId, useRef } from 'react'

import { Select } from '~/components/select'
import { useSelectValueSync } from '~/utils/use-select-value-sync'

type Option = {
  value: string
  label: string
}

type Props = {
  defaultValue: string
  emptyLabel: string
  label: string
  name: string
  options: Option[]
}

/**
 * One filter of the Filtry panel (design 22d): the design system's `Select`,
 * which applies at once by submitting its form.
 *
 * @param props.emptyLabel - The option that turns the filter off, e.g. Všechny.
 */
export const FilterSelect = ({
  defaultValue,
  emptyLabel,
  label,
  name,
  options,
}: Props) => {
  const id = useId()
  const selectRef = useRef<HTMLSelectElement>(null)

  useSelectValueSync(selectRef, defaultValue)

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    event.currentTarget.form?.requestSubmit()
  }

  return (
    <Select
      defaultValue={defaultValue}
      id={id}
      label={label}
      name={name}
      onChange={handleChange}
      ref={selectRef}
    >
      {/* Empty value = filter off; parsing and serialization both drop it. */}
      <option value={''}>{emptyLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
