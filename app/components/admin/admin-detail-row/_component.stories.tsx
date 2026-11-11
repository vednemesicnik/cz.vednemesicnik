// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '~/components/button'

import { AdminDetailRowActions } from '../admin-detail-row-actions'
import { AdminDetailRowLabel } from '../admin-detail-row-label'
import { AdminDetailRowValue } from '../admin-detail-row-value'
import { AdminDetailSection } from '../admin-detail-section'
import { AdminDetailRow } from './_component'

const meta: Meta<typeof AdminDetailRow> = {
  argTypes: {
    align: {
      control: 'inline-radio',
      options: ['center', 'start'],
    },
    children: { control: false },
  },
  component: AdminDetailRow,
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
  title: 'Administration/AdminDetailRow',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    align: 'center',
    children: (
      <>
        <AdminDetailRowLabel>Heslo</AdminDetailRowLabel>
        <AdminDetailRowValue>nastavené</AdminDetailRowValue>
        <AdminDetailRowActions>
          <Button size="sm" type="button" variant="outline">
            Změnit…
          </Button>
        </AdminDetailRowActions>
      </>
    ),
  },
}

// Without actions the row has no actions column.
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div>
      <AdminDetailRow>
        <AdminDetailRowLabel>Odkaz v e-mailu</AdminDetailRowLabel>
        <AdminDetailRowValue>
          <span>k dispozici</span>
          <span>Na redakce@vednemesicnik.cz. Nic se nenastavuje.</span>
        </AdminDetailRowValue>
      </AdminDetailRow>
      <AdminDetailRow align="start">
        <AdminDetailRowLabel>Heslo</AdminDetailRowLabel>
        <AdminDetailRowValue>
          <span>nastavené</span>
          <span>Heslo slouží jen pro nouzové přihlášení.</span>
        </AdminDetailRowValue>
        <AdminDetailRowActions>
          <Button size="sm" type="button" variant="outline">
            Změnit…
          </Button>
        </AdminDetailRowActions>
      </AdminDetailRow>
    </div>
  ),
}

// Under 440 px the name stands above the value, as in the right column.
export const Narrow: Story = {
  args: Playground.args,
  parameters: { width: '300px' },
}
