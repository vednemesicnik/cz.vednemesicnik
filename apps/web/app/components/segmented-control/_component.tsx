import { clsx } from 'clsx'
import {
  type ChangeEvent,
  createContext,
  type ReactNode,
  useContext,
  useId,
} from 'react'

import styles from './_styles.module.css'

type SegmentedControlContextValue = {
  name: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  hintId: string
}

const Context = createContext<SegmentedControlContextValue | undefined>(
  undefined,
)

type Props = {
  children: ReactNode
  name: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  className?: string
}

/**
 * One choice of a few, drawn as joined segments (design 29a, a candidate the
 * design system does not have yet). Native radio buttons, so the arrow keys
 * move the choice and a form submits it under `name`. The group is described
 * by its `SegmentedControlHint` whenever one is rendered.
 *
 * @example
 * ```tsx
 * <SegmentedControl name={'colorScheme'} onChange={…} value={'system'}>
 *   <SegmentedControlLegend>Režim</SegmentedControlLegend>
 *   <SegmentedControlOptions>
 *     <SegmentedControlOption value={'system'}>Systém</SegmentedControlOption>
 *     <SegmentedControlOption value={'light'}>Světlý</SegmentedControlOption>
 *   </SegmentedControlOptions>
 *   <SegmentedControlHint>Vzhled se řídí nastavením zařízení.</SegmentedControlHint>
 * </SegmentedControl>
 * ```
 *
 * @param props.children - The legend, the options and an optional hint
 * @param props.name - The radio buttons' form field
 * @param props.value - The chosen option's value
 * @param props.onChange - Called when another option is chosen
 * @returns The `<fieldset>`
 */
export const SegmentedControl = ({
  children,
  name,
  value,
  onChange,
  className,
}: Props) => {
  const hintId = useId()

  return (
    <Context.Provider value={{ hintId, name, onChange, value }}>
      {/* An id with no hint rendered is ignored by the accessible name and
          description, so the group never waits on its hint to register. */}
      <fieldset
        aria-describedby={hintId}
        className={clsx(styles.fieldset, className)}
      >
        {children}
      </fieldset>
    </Context.Provider>
  )
}

/**
 * What the control shares with its parts: the field, the chosen value, the
 * change handler and the hint's id.
 *
 * @returns The segmented control's context
 */
export const useSegmentedControl = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error(
      'useSegmentedControl must be used within a SegmentedControl',
    )
  }

  return context
}
