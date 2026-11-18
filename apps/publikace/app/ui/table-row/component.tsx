import type { Handle, RemixNode } from 'remix/component'

export type TableRowProps = {
  children?: RemixNode
  /** The grid every row of one table shares, head row included. */
  columns: string
  isHead?: boolean
  isLast?: boolean
  /** A row that is out of play, in tertiary ink: a closed issue. */
  isMuted?: boolean
}

/** The design system's `TableRow`: one row of a `.vdm-table`, its cells on a shared grid. */
export function TableRow(handle: Handle<TableRowProps>) {
  return () => {
    let { children, columns, isHead = false, isLast = false, isMuted = false } = handle.props
    let classes = ['vdm-row']
    if (isHead) classes.push('vdm-row--head')
    if (isMuted) classes.push('vdm-row--muted')
    if (isLast) classes.push('vdm-row--last')

    return (
      <div class={classes.join(' ')} role="row" style={{ gridTemplateColumns: columns }}>
        {children}
      </div>
    )
  }
}
