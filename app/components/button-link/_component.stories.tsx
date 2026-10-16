// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { ButtonLink } from './_component'

const meta: Meta<typeof ButtonLink> = {
  argTypes: {
    disabled: { control: 'boolean' },
  },
  component: ButtonLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/ButtonLink',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): an action under a field, in the
 * size of the text around it (design 24a).
 */
export const Playground: Story = {
  args: {
    children: 'Obnovit podle názvu',
    onClick: fn(),
  },
}

/**
 * In a hint, as the article editor's address shows it.
 */
export const InText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <p style={{ color: 'var(--text-tertiary)', fontSize: '14px', margin: 0 }}>
      Změněno ručně. <ButtonLink onClick={fn()}>Obnovit podle názvu</ButtonLink>
    </p>
  ),
}
