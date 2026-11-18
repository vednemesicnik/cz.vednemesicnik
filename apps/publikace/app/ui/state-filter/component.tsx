import type { Handle } from 'remix/component'
import { css } from 'remix/component'

export type StateFilterItem = {
  count: number
  /** The count waits on whoever reads it, in the design system's ink for that (`!`). */
  isWaiting?: boolean
  href: string
  isActive: boolean
  label: string
}

export type StateFilterProps = {
  items: readonly StateFilterItem[]
}

/* The design system draws the items as buttons; here they are links, so the address carries
   the choice (`?state=`) and the underline a link gets by default goes. */
const itemStyle = css({ textDecoration: 'none' })

/**
 * The design system's `StateFilter` as links: each item is an address, so a filter can be
 * bookmarked and the back button undoes it (`11a`, _Volba, v adrese_).
 */
export function StateFilter(handle: Handle<StateFilterProps>) {
  return () => (
    <nav aria-label="Stav" class="vdm-statefilter">
      {handle.props.items.map((item) => (
        <a
          aria-current={item.isActive ? 'true' : undefined}
          class={
            item.isActive
              ? 'vdm-statefilter__item vdm-statefilter__item--active'
              : 'vdm-statefilter__item'
          }
          href={item.href}
          mix={itemStyle}
        >
          {item.label}
          <span
            class={
              item.isWaiting === true && item.count > 0
                ? 'vdm-statefilter__count vdm-statefilter__count--attention'
                : 'vdm-statefilter__count'
            }
          >
            {item.count}
          </span>
        </a>
      ))}
    </nav>
  )
}
