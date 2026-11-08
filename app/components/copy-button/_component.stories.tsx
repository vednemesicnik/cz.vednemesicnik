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
 * Interactive base case (controls enabled): the value as text and the
 * Kopírovat button beside it (17c). Click it: the button shows a check and
 * „Zkopírováno“ for two seconds in the same width, and a screen reader hears
 * „Zkopírováno“.
 */
export const Playground: Story = {
  args: {
    children: '241358580/0300',
    value: '241358580/0300',
  },
}

/**
 * Only the icon, after a value written out beside it: named „Kopírovat“,
 * which its Tooltip shows.
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

// Stands in for a browser whose clipboard refuses the write. The real clipboard
// lives on Navigator.prototype, so dropping the stand-in brings it back, in
// whatever order stories are left.
const refuseClipboard = () => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: () => Promise.reject(new Error('Refused')) },
  })

  return () => {
    Reflect.deleteProperty(navigator, 'clipboard')
  }
}

/**
 * The clipboard refuses (design 17b): click it. The value is selected, the focus
 * stays on the button, and a sentence under it says what to do: with a mouse,
 * press Ctrl+C or ⌘C; in touch emulation, select the whole text and copy it.
 */
export const ClipboardRefused: Story = {
  args: {
    children: 'https://vednemesicnik.cz/feeds/articles.xml',
    value: 'https://vednemesicnik.cz/feeds/articles.xml',
  },
  beforeEach: refuseClipboard,
}

/** The same in the administration, in its voice: the instruction first. */
export const ClipboardRefusedInAdministration: Story = {
  args: { ...ClipboardRefused.args, surface: 'administration' },
  beforeEach: refuseClipboard,
}
