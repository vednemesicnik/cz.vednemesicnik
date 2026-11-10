// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { EditHoldDialog } from './_component'

// The props are a union by `kind`, which Storybook's args can't take apart:
// the args carry only the callbacks, the stories render the dialog, and the
// meta names no component, whose props the args aren't.
type Callbacks = {
  onCancel: () => void
  onConfirm: () => void
}

const meta: Meta<Callbacks> = {
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/EditHoldDialog',
}

export default meta
type Story = StoryObj<Callbacks>

const holdSince = new Date()
holdSince.setHours(14, 2, 0, 0)

const lastSave = new Date()
lastSave.setHours(14, 31, 0, 0)

/** The Coordinator taking someone else's edit (24g). */
export const Playground: Story = {
  args: { onCancel: fn(), onConfirm: fn() },
  render: (args) => (
    <EditHoldDialog
      content={'article'}
      holder={{
        lastSavedAt: lastSave.toISOString(),
        name: 'Jakub Novák',
        since: holdSince.toISOString(),
      }}
      kind={'take-over'}
      onCancel={args.onCancel}
      onConfirm={args.onConfirm}
    />
  ),
}

/** One's own edit open in another tab: the copy is fixed (24g). */
export const OtherTab: Story = {
  args: { onCancel: fn(), onConfirm: fn() },
  render: (args) => (
    <EditHoldDialog
      content={'issue'}
      kind={'other-tab'}
      onCancel={args.onCancel}
      onConfirm={args.onConfirm}
    />
  ),
}
