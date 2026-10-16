// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { Chip } from './_component'

const meta: Meta<typeof Chip> = {
  component: Chip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/Chip',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): a picked tag (design 24a).
 */
export const Playground: Story = {
  args: {
    children: 'podzim',
    onRemove: fn(),
  },
}

/**
 * A picked value, an archived one still attached, and one without the ×.
 */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      <Chip onRemove={fn()}>podzim</Chip>
      <Chip muted note={'archivovaný'} onRemove={fn()}>
        prázdniny
      </Chip>
      <Chip>čtení</Chip>
    </div>
  ),
}
