// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Radio } from './_component'

const meta: Meta<typeof Radio> = {
  argTypes: {
    disabled: { control: 'boolean' },
  },
  component: Radio,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/Radio',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): an author role on Upravit autora
 * (design 28c).
 */
export const Playground: Story = {
  args: {
    children: 'Tvůrce',
    name: 'role',
  },
}

/**
 * With a line under the sentence, as the roles on Nový autor.
 */
export const WithHint: Story = {
  args: {
    children: 'Přispěvatel',
    hint: 'Píše vlastní koncepty a odesílá je ke schválení.',
    name: 'role',
  },
}

/**
 * A long hint wraps beside the radio, the radio stays at the first line.
 */
export const Wrapping: Story = {
  args: {
    children: 'Tvůrce',
    hint: 'Píše vlastní koncepty, odesílá je ke schválení a vidí i cizí koncepty.',
    name: 'role',
  },
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
