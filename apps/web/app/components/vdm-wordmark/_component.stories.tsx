// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Headline } from '~/components/headline'

import { VdmWordmark } from './_component'

const meta: Meta<typeof VdmWordmark> = {
  component: VdmWordmark,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/VdmWordmark',
}

export default meta
type Story = StoryObj<typeof meta>

// The turn plays once per session; clear `vdm-wordmark-turned` from the session
// storage to see it again.
export const Playground: Story = {
  args: {
    animate: true,
  },
  render: (args) => (
    <Headline>
      <VdmWordmark {...args} />
    </Headline>
  ),
}

// The element around it gives it its meaning and size.
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '24px', justifyItems: 'start' }}>
      <Headline>
        <VdmWordmark />
      </Headline>
      <p style={{ fontSize: '24px', margin: 0 }}>
        <VdmWordmark />
      </p>
      <span style={{ fontSize: '16px' }}>
        <VdmWordmark />
      </span>
    </div>
  ),
}

// In the colour of the text around it, as in the administration sidebar.
export const TextTone: Story = {
  args: {
    tone: 'text',
  },
  render: (args) => (
    <span style={{ fontSize: '14px', fontWeight: 600 }}>
      <VdmWordmark {...args} />
    </span>
  ),
}
