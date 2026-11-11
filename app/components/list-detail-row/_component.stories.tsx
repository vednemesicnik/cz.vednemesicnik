// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminDetailRowLabel } from '~/components/admin/admin-detail-row-label'
import { AdminDetailRowValue } from '~/components/admin/admin-detail-row-value'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { Button } from '~/components/button'
import { ListDetailRowActions } from '~/components/list-detail-row-actions'

import { ListDetailRow } from './_component'

const passkeys = [
  { details: 'synchronizovaný · přidán 3. 9. 2026', title: 'Mac, Chrome' },
  {
    details: 'vázaný na zařízení · přidán 12. 9. 2026',
    title: 'Bezpečnostní klíč',
  },
  {
    details: 'synchronizovaný · přidán 20. 9. 2026',
    title: 'Telefon nebo tablet',
  },
]

const PasskeyList = ({ count }: { count: number }) =>
  count === 0 ? (
    <span>Zatím žádný.</span>
  ) : (
    <ul style={{ display: 'grid', gap: '10px', margin: 0, padding: 0 }}>
      {passkeys.slice(0, count).map((passkey) => (
        <li
          key={passkey.title}
          style={{
            alignItems: 'center',
            display: 'grid',
            gap: '12px',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span>{passkey.title}</span>
            <span>{passkey.details}</span>
          </span>
          {/* A text link, as the settings route's TextButton draws it. */}
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--link)',
              fontSize: 'var(--font-size-sm)',
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
            type="button"
          >
            Odebrat…
          </button>
        </li>
      ))}
    </ul>
  )

const meta: Meta<typeof ListDetailRow> = {
  argTypes: {
    children: { control: false },
  },
  component: ListDetailRow,
  // The 440 px rule measures the section around the row; `width` narrows it.
  decorators: [
    (Story, { parameters }) => (
      <div style={{ width: parameters.width }}>
        <AdminDetailSection>
          <Story />
        </AdminDetailSection>
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/ListDetailRow',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: (
      <>
        <AdminDetailRowLabel>Passkey</AdminDetailRowLabel>
        <AdminDetailRowValue>
          <PasskeyList count={2} />
          <span style={{ paddingBlockStart: '8px' }}>
            Přihlášení bez hesla pomocí passkey v zařízení nebo na bezpečnostním
            klíči.
          </span>
          <ListDetailRowActions>
            <Button size="sm" type="button" variant="outline">
              Přidat passkey
            </Button>
          </ListDetailRowActions>
        </AdminDetailRowValue>
      </>
    ),
  },
}

// The row's action stays under the value whether the list is empty or long.
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div>
      {[0, 1, 3].map((count) => (
        <ListDetailRow key={count}>
          <AdminDetailRowLabel>Passkey</AdminDetailRowLabel>
          <AdminDetailRowValue>
            <PasskeyList count={count} />
            <ListDetailRowActions>
              <Button size="sm" type="button" variant="outline">
                Přidat passkey
              </Button>
            </ListDetailRowActions>
          </AdminDetailRowValue>
        </ListDetailRow>
      ))}
    </div>
  ),
}

// Under 440 px the name stands above the value, the action still closes it.
export const Narrow: Story = {
  args: Playground.args,
  parameters: { width: '300px' },
}
