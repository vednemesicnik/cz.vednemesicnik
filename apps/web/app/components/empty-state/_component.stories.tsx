// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { EmptyStateLink } from '~/components/empty-state-link'
import { EmptyStateText } from '~/components/empty-state-text'

import { EmptyState } from './_component'

const meta: Meta<typeof EmptyState> = {
  component: EmptyState,
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
  title: 'Components/EmptyState',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: (
      <>
        <EmptyStateText>Tady zatím žádný článek není.</EmptyStateText>
        <EmptyStateLink to={'/articles'}>Všechny články</EmptyStateLink>
      </>
    ),
  },
}

/** The sentence alone, e.g. an empty archive (14c). */
export const WithoutLink: Story = {
  args: {
    children: (
      <EmptyStateText>V archivu zatím žádné číslo není.</EmptyStateText>
    ),
  },
}
