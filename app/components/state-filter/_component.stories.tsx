// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { StateFilter } from './_component'

const meta: Meta<typeof StateFilter> = {
  component: StateFilter,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/StateFilter',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): the Coordinator's article list
 * (design 22a), Ke schválení waiting for them.
 */
export const Playground: Story = {
  args: {
    items: [
      { isActive: true, label: 'Vše', to: '?' },
      { count: 12, isActive: false, label: 'Koncepty', to: '?state=draft' },
      {
        attention: true,
        count: 2,
        isActive: false,
        label: 'Ke schválení',
        to: '?state=pending',
      },
      { count: 3, isActive: false, label: 'Schválené', to: '?state=approved' },
      { isActive: false, label: 'Publikované', to: '?state=published' },
      { isActive: false, label: 'Archivované', to: '?state=archived' },
    ],
    label: 'Stav',
  },
}

/**
 * A Contributor's list (22i): Odeslané instead of the approval queues.
 */
export const Contributor: Story = {
  args: {
    items: [
      { isActive: false, label: 'Vše', to: '?' },
      { count: 1, isActive: false, label: 'Koncepty', to: '?state=draft' },
      { count: 2, isActive: true, label: 'Odeslané', to: '?state=submitted' },
      { isActive: false, label: 'Publikované', to: '?state=published' },
      { isActive: false, label: 'Archivované', to: '?state=archived' },
    ],
    label: 'Stav',
  },
}
