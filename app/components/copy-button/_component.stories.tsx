// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { CopyButton } from './_component'

const meta: Meta<typeof CopyButton> = {
  component: CopyButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/CopyButton',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled). Click it: the icon turns into a
 * check for two seconds.
 */
export const Playground: Story = {
  args: {
    children: '241358580/0300',
    value: '241358580/0300',
  },
}

/**
 * Only the icon, after a value written out beside it.
 */
export const IconOnly: Story = {
  args: {
    value: '2003',
  },
}

/**
 * A long value that wraps: the emergency sign-in link in its box (design 28e).
 */
export const LongValue: Story = {
  args: Playground.args,
  render: () => (
    <div
      style={{
        fontFamily: 'ui-monospace, monospace',
        fontSize: '13px',
        overflowWrap: 'anywhere',
        width: '360px',
      }}
    >
      <CopyButton value="https://vednemesicnik.cz/administration/sign-in/emergency-link/verify?token=q8Zt…">
        https://vednemesicnik.cz/administration/sign-in/emergency-link/verify?token=q8Zt…
      </CopyButton>
    </div>
  ),
}
