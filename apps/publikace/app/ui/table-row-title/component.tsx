import type { Handle } from 'remix/component'

export type TableRowTitleProps = {
  href: string
  /** The title opens something outside the app, an article's Doc, in a new tab (`12a`). */
  isNewTab?: boolean
  /** The second line under the title: _založeno 3. 11. 2026_. */
  sub?: string
  title: string
}

/** The design system's `TableRowTitle`: the whole title is one link, to a detail or a Doc. */
export function TableRowTitle(handle: Handle<TableRowTitleProps>) {
  return () => {
    let { href, isNewTab = false, sub, title } = handle.props
    return (
      <div class="vdm-row__title" role="cell">
        {isNewTab ? (
          <a class="vdm-row__link" href={href} rel="noopener" target="_blank">
            {title}
            <span class="vdm-sr-only"> (otevře se v nové záložce)</span>
          </a>
        ) : (
          <a class="vdm-row__link" href={href}>
            {title}
          </a>
        )}
        {sub === undefined ? null : <span class="vdm-row__sub">{sub}</span>}
      </div>
    )
  }
}
