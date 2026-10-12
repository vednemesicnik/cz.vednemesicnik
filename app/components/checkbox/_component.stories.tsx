// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Checkbox } from './_component'

const meta: Meta<typeof Checkbox> = {
  argTypes: {
    disabled: { control: 'boolean' },
  },
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/Checkbox',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): the identity check of the
 * emergency link dialog (design 28e).
 */
export const Playground: Story = {
  args: {
    children: 'Totožnost ověřena osobně nebo při hlasovém hovoru',
  },
}

/**
 * With a line under the sentence.
 */
export const WithHint: Story = {
  args: {
    children: 'Sdílet s ostatními',
    hint: 'Nápověda pod větou',
  },
}

/**
 * A long sentence wraps beside the box, the box stays at the first line.
 */
export const Wrapping: Story = {
  args: Playground.args,
  decorators: [
    (Story) => (
      <div style={{ width: '220px' }}>
        <Story />
      </div>
    ),
  ],
}

export const Disabled: Story = {
  args: { ...Playground.args, disabled: true },
}
