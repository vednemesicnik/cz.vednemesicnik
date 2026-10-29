// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

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

const categoryLink = (label: string) => ({
  label,
  to: `/articles/categories/${label.toLowerCase()}`,
})

export const Playground: Story = {
  args: {
    items: ['Kultura', 'Reportáž', 'Rozhovor', 'Škola', 'Sport'].map(
      categoryLink,
    ),
    label: 'Rubriky',
    more: { label: 'Všechny rubriky', to: '/articles/categories' },
  },
}

export const OneItem: Story = {
  args: { ...Playground.args, items: [categoryLink('Kultura')] },
}

/** The archive's years, named for a screen reader „Roky v archivu“ (14a). */
export const Years: Story = {
  args: {
    accessibleLabel: 'Roky v archivu',
    items: ['2026', '2025', '2024', '2023'].map((year) => ({
      label: year,
      to: `#${year}`,
    })),
    label: 'Roky',
  },
}

/** Below 768 px: one sideways-scrolling row of 44 px pills (design 11d). */
export const Mobile: Story = {
  args: Playground.args,
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
}
