import type { Handle, RemixNode } from 'remix/component'

export type TableRowProps = {
  children?: RemixNode
  /** The grid every row of one table shares, head row included. */
  columns: string
  isHead?: boolean
  isLast?: boolean
  /** A row that is out of play, in tertiary ink: a closed issue. */
  isMuted?: boolean
  /** The row whose detail stands open under it, on the tint the detail shares (`12b`). */
  isSelected?: boolean
  /** The anchor an address scrolls the row to. */
  id?: string
}

/** The design system's `TableRow`: one row of a `.vdm-table`, its cells on a shared grid. */
export function TableRow(handle: Handle<TableRowProps>) {
  return () => {
    let {
      children,
      columns,
      id,
      isHead = false,
      isLast = false,
      isMuted = false,
      isSelected = false,
    } = handle.props
    let classes = ['vdm-row']
    if (isHead) classes.push('vdm-row--head')
    if (isMuted) classes.push('vdm-row--muted')
    if (isLast) classes.push('vdm-row--last')
    if (isSelected) classes.push('vdm-row--selected')

    return (
      <div class={classes.join(' ')} id={id} role="row" style={{ gridTemplateColumns: columns }}>
        {children}
      </div>
    )
  }
}
