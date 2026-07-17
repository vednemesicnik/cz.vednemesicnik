// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router'

import { TableSortableHeaderCell } from './_component'

const meta: Meta<typeof TableSortableHeaderCell> = {
  component: TableSortableHeaderCell,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminTable/SortableHeaderCell',
}

export default meta
type Story = StoryObj<typeof meta>

// Renders the cell inside a valid table structure at a given URL so
// useSearchParams reflects the sort/order state.
const withTableAt = (search: string, children: ReactNode) => (
  <MemoryRouter initialEntries={[{ pathname: '/', search }]}>
    <table style={{ borderCollapse: 'separate', width: '100%' }}>
      <thead>
        <tr>{children}</tr>
      </thead>
    </table>
  </MemoryRouter>
)

/**
 * No `sort` param and no `defaultSort`: the column is inactive. The indicator
 * stays hidden until the header is hovered or focused.
 */
export const Inactive: Story = {
  render: () =>
    withTableAt(
      '',
      <TableSortableHeaderCell sortKey={'title'}>
        Název
      </TableSortableHeaderCell>,
    ),
}

/**
 * Ascending: the column is the active sort. The indicator points up.
 */
export const Ascending: Story = {
  render: () =>
    withTableAt(
      '?sort=title&order=asc',
      <TableSortableHeaderCell sortKey={'title'}>
        Název
      </TableSortableHeaderCell>,
    ),
}

/**
 * Descending: the same column with the indicator rotated 180°.
 */
export const Descending: Story = {
  render: () =>
    withTableAt(
      '?sort=title&order=desc',
      <TableSortableHeaderCell sortKey={'title'}>
        Název
      </TableSortableHeaderCell>,
    ),
}

/**
 * Default column: with no `sort` param present, the column matching
 * `defaultSort` renders as the active ascending sort.
 */
export const DefaultColumn: Story = {
  render: () =>
    withTableAt(
      '',
      <TableSortableHeaderCell defaultSort={'createdAt'} sortKey={'createdAt'}>
        Vytvořeno
      </TableSortableHeaderCell>,
    ),
}
