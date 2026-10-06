// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Wordmark } from './_component'

const meta: Meta<typeof Wordmark> = {
  component: Wordmark,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/Wordmark',
}

export default meta
type Story = StoryObj<typeof meta>

// The turn plays once per session; clear `vdm-wordmark-turned` from the session
// storage to see it again.
export const Playground: Story = {
  args: {
    animate: true,
    as: 'span',
  },
  render: (args) => (
    <div style={{ fontSize: '76px' }}>
      <Wordmark {...args} />
    </div>
  ),
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '24px', justifyItems: 'start' }}>
      <div style={{ fontSize: '76px' }}>
        <Wordmark />
      </div>
      <div style={{ fontSize: '44px' }}>
        <Wordmark />
      </div>
      <div style={{ fontSize: '24px' }}>
        <Wordmark />
      </div>
    </div>
  ),
}
