// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'

import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { Button } from '~/components/button'
import { ContentChangedDialogActions } from '~/components/content-changed-dialog-actions'

import { ContentChangedDialog } from './_component'

const meta: Meta<typeof ContentChangedDialog> = {
  component: ContentChangedDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/ContentChangedDialog',
}

export default meta
type Story = StoryObj<typeof meta>

/** The article's dialog: the text can be copied before reloading (24i). */
export const Playground: Story = {
  args: {
    canReload: true,
    children: (
      <>
        <AdminModalTitle>Článek se mezitím změnil</AdminModalTitle>
        <AdminModalDescription>
          Editor byl 14 minut bez připojení. Poslední uložení dnes v 14:20.
          Novější změny z tohoto editoru se neuložily, aby nepřepsaly mezitím
          upravený článek. Před načtením aktuální verze si zkopírujte text
          článku.
        </AdminModalDescription>
        <ContentChangedDialogActions>
          <Button size={'sm'} type={'button'} variant={'ghost'}>
            Zkopírovat celý text
          </Button>
        </ContentChangedDialogActions>
      </>
    ),
    onClose: fn(),
    onOpenDetail: fn(),
    onReload: fn(),
  },
}

/** Someone holds it now: the way out is the detail, nothing to rescue here. */
export const WithoutRescue: Story = {
  args: {
    ...Playground.args,
    canReload: false,
    children: (
      <>
        <AdminModalTitle>Číslo se mezitím změnilo</AdminModalTitle>
        <AdminModalDescription>
          Poslední uložení dnes v 14:20. Novější změny z tohoto editoru se
          neuložily, aby nepřepsaly mezitím upravené číslo.
        </AdminModalDescription>
        <ContentChangedDialogActions />
      </>
    ),
  },
}
