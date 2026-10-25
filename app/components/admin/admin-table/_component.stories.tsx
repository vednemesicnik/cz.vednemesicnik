// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import { StatusTag } from '~/components/status-tag'

import { AdminTable } from './_component'
import { TableActionsCell } from './components/actions-cell'
import { TableBody } from './components/body'
import { TableCell } from './components/cell'
import { TableDetailsCell } from './components/details-cell'
import { TableDetailsLine } from './components/details-line'
import { TableGroupHeading } from './components/group-heading'
import { TableHeader } from './components/header'
import { TableHeaderCell } from './components/header-cell'
import { TableImageCell } from './components/image-cell'
import { TableNameAddress } from './components/name-address'
import { TableNameCell } from './components/name-cell'
import { TableRow } from './components/row'
import { TableRowLink } from './components/row-link'
import { TableRowMenu } from './components/row-menu'
import { TableSelectionCell } from './components/selection-cell'
import { TableSelectionHeaderCell } from './components/selection-header-cell'
import { TableSortableHeaderCell } from './components/sortable-header-cell'
import { TableStateCell } from './components/state-cell'

const sampleArticles = [
  {
    archived: false,
    author: 'Anna Dvořáková',
    state: 'Čeká na schválení',
    title: 'Rozhovor s ředitelkou o nové budově',
    updatedAt: '25. 9. 2026',
  },
  {
    archived: false,
    author: 'Tereza Malá',
    state: 'Koncept',
    title: 'Jak jsme psali reportáž z maturitního plesu',
    updatedAt: '26. 9. 2026',
  },
  {
    archived: true,
    author: 'Tereza Malá',
    state: 'Archivováno',
    title: 'Plán akcí na jaro 2026',
    updatedAt: '2. 6. 2026',
  },
]

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
    columnsClassName: {
      control: false,
      description:
        "A class from the list's CSS module that sets grid-template-columns for a table from 1280 px (31a).",
    },
    pending: {
      control: 'boolean',
      description:
        'Dims the table and shows a centered spinner during navigation.',
    },
    stickyHeader: {
      control: 'boolean',
      description:
        'Pins the header to the page from 1024 px, where the table fits without sideways scroll.',
    },
  },
  component: AdminTable,
  parameters: {
    docs: {
      description: {
        component:
          'Shared administration table (design 22a): no box, small sentence-case header labels, one line under the header and one between rows. Wraps content in a horizontal-scroll container with optional sticky header and pending overlay; composes with TableHeader/TableRow/TableCell (an empty list is a ListEmptyCard in place of the table, 22e). Tabular numbers and right-aligned action columns come for free.',
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
 * The article list as 22a draws it: selection, a sortable column (Upraveno ↓)
 * and a muted archived row.
 */
export const ArticleList: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/?sort=updatedAt&order=desc']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: { controls: { disable: true } },
  render: () => (
    <AdminTable>
      <TableHeader>
        <TableSelectionHeaderCell
          checked={false}
          indeterminate={false}
          onChange={() => {}}
        />
        <TableSortableHeaderCell sortKey={'title'}>
          Název
        </TableSortableHeaderCell>
        <TableHeaderCell>Autor</TableHeaderCell>
        <TableSortableHeaderCell sortKey={'updatedAt'}>
          Upraveno
        </TableSortableHeaderCell>
        <TableHeaderCell>Stav</TableHeaderCell>
        <TableHeaderCell variant="actions">Akce</TableHeaderCell>
      </TableHeader>
      <TableBody>
        {sampleArticles.map((article) => (
          <TableRow key={article.title} muted={article.archived}>
            <TableSelectionCell
              checked={false}
              label={`Vybrat článek ${article.title}`}
              onChange={() => {}}
            />
            <TableCell>{article.title}</TableCell>
            <TableCell>{article.author}</TableCell>
            <TableCell>{article.updatedAt}</TableCell>
            <TableCell>{article.state}</TableCell>
            <TableCell variant="actions">Upravit</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </AdminTable>
  ),
}

/**
 * Rows grouped under subheadings, as the archive groups issues by year (26a):
 * one `TableBody` per group, its heading first.
 */
export const GroupedRows: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <AdminTable>
      <TableHeader>
        <TableHeaderCell>Číslo</TableHeaderCell>
        <TableHeaderCell>Pořadí</TableHeaderCell>
        <TableHeaderCell>Stav</TableHeaderCell>
      </TableHeader>
      {[
        { issues: ['září 2026', 'červen 2026'], year: '2026' },
        { issues: ['prosinec 2025'], year: '2025' },
      ].map(({ issues, year }) => (
        <TableBody key={year}>
          <TableGroupHeading colSpan={3}>{year}</TableGroupHeading>
          {issues.map((issue, index) => (
            <TableRow key={issue}>
              <TableCell>{issue}</TableCell>
              <TableCell>
                {issues.length - index}/{year}
              </TableCell>
              <TableCell>Publikováno</TableCell>
            </TableRow>
          ))}
        </TableBody>
      ))}
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
 * Widths by weight on a wide table (31a): from a 1280 px table the columns
 * follow the list's template — Jméno 3, Role 1 with a 150 px minimum, Články
 * and Akce fixed. Below 1280 px the table sizes itself natively. Widen the
 * canvas past 1280 px to see it.
 */
export const WideColumns: Story = {
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  render: () => (
    <>
      <style>
        {
          '.admin-table-story-columns { grid-template-columns: minmax(0, 3fr) minmax(162px, 1fr) 92px 94px; }'
        }
      </style>
      <AdminTable columnsClassName={'admin-table-story-columns'}>
        <Head />
        <TableBody>
          <Rows />
        </TableBody>
      </AdminTable>
    </>
  ),
}

/**
 * Rows that fold on a phone (design 32, 22g): below 768 px each row is its
 * parts — the image, the name, the state, the details — beside one „⋯“, and
 * a tap on the row opens the detail. The checkbox and the plain cells leave.
 * The first row has a cover, the second no state, the third neither. Switch
 * the viewport to a phone to see it.
 */
export const FoldsOnPhone: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: { controls: { disable: true } },
  render: () => (
    <AdminTable foldsOnPhone={true}>
      <TableHeader>
        <TableSelectionHeaderCell
          checked={false}
          indeterminate={false}
          onChange={() => {}}
        />
        <TableHeaderCell>
          <span className={'screen-reader-only'}>Obálka</span>
        </TableHeaderCell>
        <TableHeaderCell>Název</TableHeaderCell>
        <TableHeaderCell>Pořadí</TableHeaderCell>
        <TableHeaderCell>Stav</TableHeaderCell>
        <TableHeaderCell variant="actions">Akce</TableHeaderCell>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableSelectionCell
            checked={false}
            label={'Vybrat číslo září 2026'}
            onChange={() => {}}
          />
          <TableImageCell>
            <div
              style={{
                aspectRatio: '210 / 297',
                background: 'var(--bg-tertiary)',
                width: 40,
              }}
            />
          </TableImageCell>
          <TableNameCell>
            <TableRowLink to={'/'}>září 2026</TableRowLink>
            <TableNameAddress>vdm-2026-3.pdf</TableNameAddress>
          </TableNameCell>
          <TableCell>3/2026</TableCell>
          <TableStateCell>
            <StatusTag
              detail={'Odesláno · Jakub Novák · 26. 9. 2026'}
              state={'pending'}
            />
          </TableStateCell>
          <TableDetailsCell>
            <TableDetailsLine>3/2026</TableDetailsLine>
          </TableDetailsCell>
          <TableActionsCell>
            <TableRowMenu>
              <ActionMenu
                items={[{ label: 'Schválit', onSelect: () => {} }]}
                label={'Další akce s číslem září 2026'}
                size={'sm'}
              />
            </TableRowMenu>
          </TableActionsCell>
        </TableRow>
        <TableRow>
          <TableSelectionCell
            checked={false}
            label={'Vybrat autora Jakub Novák'}
            onChange={() => {}}
          />
          <TableCell>{null}</TableCell>
          <TableNameCell>
            <TableRowLink to={'/'}>Jakub Novák</TableRowLink>
          </TableNameCell>
          <TableCell>—</TableCell>
          <TableCell>Tvůrce</TableCell>
          <TableDetailsCell>
            <TableDetailsLine>Tvůrce</TableDetailsLine>
            <TableDetailsLine>
              Publikované články, epizody a čísla: 21
            </TableDetailsLine>
          </TableDetailsCell>
          <TableActionsCell>
            <TableRowMenu>
              <ActionMenu
                items={[{ label: 'Upravit', onSelect: () => {} }]}
                label={'Další akce s autorem Jakub Novák'}
                size={'sm'}
              />
            </TableRowMenu>
          </TableActionsCell>
        </TableRow>
        <TableRow>
          <TableSelectionCell
            checked={false}
            label={'Vybrat rubriku Kultura'}
            onChange={() => {}}
          />
          <TableCell>{null}</TableCell>
          <TableNameCell>
            <TableRowLink to={'/'}>Kultura</TableRowLink>
          </TableNameCell>
          <TableCell>—</TableCell>
          <TableStateCell>
            <StatusTag state={'published'} />
          </TableStateCell>
          <TableDetailsCell>
            <TableDetailsLine>18 publikovaných článků</TableDetailsLine>
          </TableDetailsCell>
          <TableActionsCell>{null}</TableActionsCell>
        </TableRow>
      </TableBody>
    </AdminTable>
  ),
}

/**
 * Sticky header on a long list: only the page scrolls, and from 1024 px the
 * header stays pinned to the top of the page while the rows scroll under it.
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
