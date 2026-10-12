// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { AdminSignInText } from '~/components/admin/admin-sign-in-text'
import { Button } from '~/components/button'
import { Link } from '~/components/link'

import { AdminSignInCard } from './_component'

const meta: Meta<typeof AdminSignInCard> = {
  component: AdminSignInCard,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminSignInCard',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): a card with its text and button,
 * as the confirmation of the emergency link (design 20f).
 */
export const Playground: Story = {
  args: {
    children: (
      <>
        <AdminSignInText>Účet: jakub.novak@vednemesicnik.cz</AdminSignInText>
        <Button>Přihlásit se</Button>
        <AdminSignInText variant={'note'}>
          Po přihlášení si můžete v Nastavení přidat passkey.
        </AdminSignInText>
      </>
    ),
    title: 'Potvrďte přihlášení',
  },
}

/**
 * A sentence and a link under it (20f, a link that no longer works).
 */
export const TextAndLink: Story = {
  args: {
    children: (
      <>
        <AdminSignInText>
          Přihlaste se jinak nebo se obraťte na Administrátora či Vlastníka —
          tento nouzový odkaz už neplatí.
        </AdminSignInText>
        <Link to={'/administration/sign-in'}>Přihlásit se jinak</Link>
      </>
    ),
    title: 'Odkaz už neplatí',
  },
}

/**
 * The sign-in chooser: the turning name over a smaller title (20a, hhcprc34).
 */
export const WithWordmark: Story = {
  args: {
    children: (
      <>
        <Button>Přihlásit se přes Google</Button>
        <Button variant={'outline'}>Přihlásit se pomocí passkey</Button>
        <Link to={'/administration/sign-in/password'}>
          Nouzové přihlášení heslem
        </Link>
      </>
    ),
    title: 'Přihlášení do administrace',
    wordmark: true,
  },
}

/**
 * Under 768 px there is no card: the content stands on the white page (20e).
 */
export const Phone: Story = {
  args: Playground.args,
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
}
