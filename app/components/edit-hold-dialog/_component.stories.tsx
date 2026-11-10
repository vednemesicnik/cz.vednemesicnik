// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { EditHoldDialog } from './_component'

// Untyped: the props are a union by `kind`, which Storybook's args can't
// take apart, so the stories render the dialog themselves.
const meta: Meta = {
  component: EditHoldDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/EditHoldDialog',
}

export default meta
type Story = StoryObj

const startOfToday = new Date()
startOfToday.setHours(14, 2, 0, 0)

const lastSave = new Date()
lastSave.setHours(14, 31, 0, 0)

/** The Coordinator taking someone else's edit (24g). */
export const Playground: Story = {
  render: () => (
    <EditHoldDialog
      content={'article'}
      holder={{
        lastSavedAt: lastSave.toISOString(),
        name: 'Jakub Novák',
        since: startOfToday.toISOString(),
      }}
      kind={'take-over'}
      onCancel={fn()}
      onConfirm={fn()}
    />
  ),
}

/** One's own edit open in another tab: the copy is fixed (24g). */
export const OtherTab: Story = {
  render: () => (
    <EditHoldDialog
      content={'issue'}
      kind={'other-tab'}
      onCancel={fn()}
      onConfirm={fn()}
    />
  ),
}
