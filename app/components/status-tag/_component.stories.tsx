// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { StatusTag } from './_component'

const meta: Meta<typeof StatusTag> = {
  argTypes: {
    state: {
      control: 'select',
      options: ['draft', 'pending', 'approved', 'published', 'archived'],
    },
  },
  component: StatusTag,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/StatusTag',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled).
 */
export const Playground: Story = {
  args: {
    detail: 'od 25. 9. 2026',
    state: 'pending',
  },
}

/**
 * Every state with its fact line, as a list row carries it (design 22b).
 */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
      <StatusTag detail={'uloženo dnes v 14:02'} state={'draft'} />
      <StatusTag detail={'od 25. 9. 2026'} state={'pending'} />
      <StatusTag detail={'27. 9. 2026'} state={'approved'} />
      <StatusTag detail={'24. 9. 2026'} state={'published'} />
      <StatusTag detail={'2. 6. 2026'} state={'archived'} />
    </div>
  ),
}

/** Grey in every state on the public web's preview (10d). */
export const Muted: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
      <StatusTag muted state={'draft'} />
      <StatusTag muted state={'pending'} />
      <StatusTag muted state={'approved'} />
      <StatusTag muted state={'archived'} />
    </div>
  ),
}
