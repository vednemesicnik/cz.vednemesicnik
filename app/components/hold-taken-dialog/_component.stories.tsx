// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { AdminModalDescription } from '~/components/admin/admin-modal-description'

import { HoldTakenDialog } from './_component'

const meta: Meta<typeof HoldTakenDialog> = {
  component: HoldTakenDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/HoldTakenDialog',
}

export default meta
type Story = StoryObj<typeof meta>

/** Everything saved: the editor only reads now (24h). */
export const Playground: Story = {
  args: {
    children: (
      <AdminModalDescription>
        Všechny změny jsou uložené. Poslední uložení dnes v 14:31. Článek teď
        můžete jen číst.
      </AdminModalDescription>
    ),
    holderName: 'Jakub Novák',
    onOpenDetail: fn(),
    onStay: fn(),
  },
}

/** Changes that did not make it, with what to do before leaving. */
export const WithUnsentChanges: Story = {
  args: {
    ...Playground.args,
    children: (
      <>
        <AdminModalDescription>
          Některé změny se nestihly uložit. Poslední uložení dnes v 14:31.
          Článek teď můžete jen číst.
        </AdminModalDescription>
        <AdminModalDescription>
          Před otevřením detailu si zkopírujte text článku.
        </AdminModalDescription>
      </>
    ),
  },
}
