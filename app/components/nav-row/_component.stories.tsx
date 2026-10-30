// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'
import { NavRowItem } from '~/components/nav-row-item'
import { NavRowMore } from '~/components/nav-row-more'

import { NavRow } from './_component'

const meta: Meta<typeof NavRow> = {
  component: NavRow,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/NavRow',
}

export default meta
type Story = StoryObj<typeof meta>

const CATEGORIES = ['Kultura', 'Reportáž', 'Rozhovor', 'Škola', 'Sport']

const YEARS = Array.from({ length: 18 }, (_, index) => String(2026 - index))

/** The categories on `/articles`: they fit, so nothing scrolls (11a). */
export const Playground: Story = {
  args: {
    children: (
      <>
        {CATEGORIES.map((category) => (
          <NavRowItem
            key={category}
            to={`/articles/categories/${category.toLowerCase()}`}
          >
            {category}
          </NavRowItem>
        ))}
        <NavRowMore to={'/articles/categories'}>Všechny rubriky</NavRowMore>
      </>
    ),
    label: 'Rubriky',
  },
}

/**
 * The archive's years, named for a screen reader „Roky v archivu“ (14a). They
 * don't fit: the row scrolls, its far edge fades, and with a mouse the step
 * buttons show. 2014 is where the reader is, scrolled into view.
 */
export const Years: Story = {
  args: {
    accessibleLabel: 'Roky v archivu',
    children: YEARS.map((year) => (
      <NavRowItem isCurrent={year === '2014'} key={year} to={`#${year}`}>
        {year}
      </NavRowItem>
    )),
    label: 'Roky',
  },
}
