// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminTable } from './_component'
import { TableBody } from './components/body'
import { TableCell } from './components/cell'
import { TableEmptyRow } from './components/empty-row'
import { TableHeader } from './components/header'
import { TableHeaderCell } from './components/header-cell'
import { TableRow } from './components/row'

const sampleRows = [
  { articles: 42, id: 1, name: 'Anna Nováková', role: 'Koordinátor' },
  { articles: 17, id: 2, name: 'Petr Svoboda', role: 'Tvůrce' },
  { articles: 8, id: 3, name: 'Jana Dvořáková', role: 'Přispěvatel' },
  { articles: 23, id: 4, name: 'Tomáš Černý', role: 'Tvůrce' },
  { articles: 3, id: 5, name: 'Eva Procházková', role: 'Přispěvatel' },
]

const Rows = () =>
  sampleRows.map((row) => (
    <TableRow key={row.id}>
      <TableCell>{row.name}</TableCell>
      <TableCell>{row.role}</TableCell>
      <TableCell align="right">{row.articles}</TableCell>
      <TableCell variant="actions">Upravit</TableCell>
    </TableRow>
  ))

const Head = () => (
  <TableHeader>
    <TableHeaderCell>Jméno</TableHeaderCell>
    <TableHeaderCell>Role</TableHeaderCell>
    <TableHeaderCell align="right">Články</TableHeaderCell>
    <TableHeaderCell variant="actions">Akce</TableHeaderCell>
  </TableHeader>
)

const meta: Meta<typeof AdminTable> = {
  argTypes: {
    pending: {
      control: 'boolean',
      description:
        'Dims the table and shows a centered spinner during navigation.',
    },
    stickyHeader: {
      control: 'boolean',
      description: 'Pins the header while the list scrolls inside the wrapper.',
    },
  },
  component: AdminTable,
  parameters: {
    docs: {
      description: {
        component:
          'Shared administration table. Wraps content in a horizontal-scroll container with optional sticky header and pending overlay; composes with TableHeader/TableRow/TableCell and TableEmptyRow. Zebra striping, tabular numbers, and right-aligned action columns come for free.',
      },
    },
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminTable',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive table. Toggle `pending` and `stickyHeader` in the controls.
 */
export const Playground: Story = {
  args: {
    pending: false,
    stickyHeader: false,
  },
  render: (args) => (
    <AdminTable {...args}>
      <Head />
      <TableBody>
        <Rows />
      </TableBody>
    </AdminTable>
  ),
}

/**
 * Empty list — TableEmptyRow spans every column with a muted centered message.
 */
export const Empty: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <AdminTable>
      <Head />
      <TableBody>
        <TableEmptyRow colSpan={4}>Žádní autoři</TableEmptyRow>
      </TableBody>
    </AdminTable>
  ),
}

/**
 * Pending overlay during navigation: table dims, pointer events are blocked,
 * a centered spinner appears, and the wrapper reports aria-busy.
 */
export const Pending: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <AdminTable pending={true}>
      <Head />
      <TableBody>
        <Rows />
      </TableBody>
    </AdminTable>
  ),
}

/**
 * Sticky header on a long list: the wrapper becomes the vertical scroll context,
 * so the header stays pinned while rows scroll beneath it.
 */
export const StickyHeader: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <AdminTable stickyHeader={true}>
      <Head />
      <TableBody>
        {Array.from({ length: 40 }, (_, index) => (
          <TableRow key={index}>
            <TableCell>Řádek {index + 1}</TableCell>
            <TableCell>Tvůrce</TableCell>
            <TableCell align="right">{index * 3}</TableCell>
            <TableCell variant="actions">Upravit</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AdminTable>
  ),
}
