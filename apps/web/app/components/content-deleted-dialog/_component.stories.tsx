// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'

import { ContentDeletedDialog } from './_component'

const meta: Meta<typeof ContentDeletedDialog> = {
  component: ContentDeletedDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/ContentDeletedDialog',
}

export default meta
type Story = StoryObj<typeof meta>

/** The issue's dialog with details that stayed unsent (26m; copy rvp9ojsm). */
export const Playground: Story = {
  args: {
    children: (
      <>
        <AdminModalTitle>Číslo bylo smazáno</AdminModalTitle>
        <AdminModalDescription>
          Číslo už nelze upravovat. Údaje zůstanou vidět jen do obnovení
          stránky, odchodu nebo zavření editoru. Soubory PDF a obálky byly
          smazány.
        </AdminModalDescription>
        <AdminModalDescription>
          Některé změny údajů se nestihly uložit. Neuložené změny: Název.
        </AdminModalDescription>
        <AdminModalDescription>
          Před odchodem na seznam si poznamenejte údaje.
        </AdminModalDescription>
      </>
    ),
    onOpenList: fn(),
    onStay: fn(),
  },
}
