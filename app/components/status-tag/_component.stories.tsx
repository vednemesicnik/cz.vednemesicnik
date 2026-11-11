// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { StatusTagDetail } from '../status-tag-detail'
import { StatusTag } from './_component'

const meta: Meta<typeof StatusTag> = {
  argTypes: {
    children: { control: false },
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
    children: <StatusTagDetail>od 25. 9. 2026</StatusTagDetail>,
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
      <StatusTag state={'draft'}>
        <StatusTagDetail>uloženo dnes v 14:02</StatusTagDetail>
      </StatusTag>
      <StatusTag state={'pending'}>
        <StatusTagDetail>od 25. 9. 2026</StatusTagDetail>
      </StatusTag>
      <StatusTag state={'approved'}>
        <StatusTagDetail>27. 9. 2026</StatusTagDetail>
      </StatusTag>
      <StatusTag state={'published'}>
        <StatusTagDetail>24. 9. 2026</StatusTagDetail>
      </StatusTag>
      <StatusTag state={'archived'}>
        <StatusTagDetail>2. 6. 2026</StatusTagDetail>
      </StatusTag>
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
