// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ReactNode, useEffect, useRef } from 'react'

import { AdminDeleteConfirmationDialogActions } from '~/components/admin/admin-delete-confirmation-dialog-actions'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'

import { AdminDeleteConfirmationDialog } from './_component'

const meta: Meta<typeof AdminDeleteConfirmationDialog> = {
  component: AdminDeleteConfirmationDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Components/AdminDeleteConfirmationDialog',
}

export default meta
type Story = StoryObj<typeof meta>

// The page opens the dialog through its ref (`useAdminDeleteConfirmationDialog`).
const OpenDialog = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <AdminDeleteConfirmationDialog ref={ref}>
      {children}
    </AdminDeleteConfirmationDialog>
  )
}

/** Deleting a draft: the article by its title under the question (23f). */
export const Playground: Story = {
  render: () => (
    <OpenDialog>
      <AdminModalTitle>Smazat koncept?</AdminModalTitle>
      <AdminModalSubject>
        Deset knih na podzim, které nejsou v osnovách
      </AdminModalSubject>
      <AdminModalDescription>Smazání je nevratné.</AdminModalDescription>
      <AdminDeleteConfirmationDialogActions>
        Smazat
      </AdminDeleteConfirmationDialogActions>
    </OpenDialog>
  ),
}

/** An account: the name in the question, the button says what goes (28g). */
export const WithoutSubject: Story = {
  render: () => (
    <OpenDialog>
      <AdminModalTitle>Smazat účet: Tereza Nováková?</AdminModalTitle>
      <AdminModalDescription>
        Tímto účtem se už nepůjde přihlásit. Autor i jméno u obsahu zůstanou
        zachovány. Vrátit to nejde.
      </AdminModalDescription>
      <AdminDeleteConfirmationDialogActions>
        Smazat účet
      </AdminDeleteConfirmationDialogActions>
    </OpenDialog>
  ),
}
