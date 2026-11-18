import type { Handle } from 'remix/component'

export type TableRowTitleProps = {
  href: string
  /** The second line under the title: _založeno 3. 11. 2026_. */
  sub?: string
  title: string
}

/** The design system's `TableRowTitle`: the whole title links to the detail. */
export function TableRowTitle(handle: Handle<TableRowTitleProps>) {
  return () => {
    let { href, sub, title } = handle.props
    return (
      <div class="vdm-row__title" role="cell">
        <a class="vdm-row__link" href={href}>
          {title}
        </a>
        {sub === undefined ? null : <span class="vdm-row__sub">{sub}</span>}
      </div>
    )
  }
}
