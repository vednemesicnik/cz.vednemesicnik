// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '~/components/button'

import { AdminSelectionBarActions } from '../admin-selection-bar-actions'
import { AdminSelectionBarMessage } from '../admin-selection-bar-message'
import { AdminSelectionBar } from './_component'

const meta: Meta<typeof AdminSelectionBar> = {
  component: AdminSelectionBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminSelectionBar',
}

export default meta
type Story = StoryObj<typeof meta>

/** Three drafts selected: every action applies to all of them (22c). */
export const Playground: Story = {
  args: {
    children: (
      <AdminSelectionBarActions>
        <Button size={'sm'} type={'button'} variant={'outline'}>
          Publikovat…
        </Button>
        <Button size={'sm'} type={'button'} variant={'outline'}>
          Smazat…
        </Button>
      </AdminSelectionBarActions>
    ),
    count: 3,
    onClear: () => {},
  },
}

/** A published article in the selection: no action applies to all (22c). */
export const NoCommonAction: Story = {
  args: {
    children: (
      <AdminSelectionBarMessage>
        Pro tento výběr není společná akce.
      </AdminSelectionBarMessage>
    ),
    count: 4,
    onClear: () => {},
  },
}
