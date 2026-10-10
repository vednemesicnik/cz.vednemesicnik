// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '~/components/button'

import { AdminDetailItem } from '../admin-detail-item'
import { AdminDetailList } from '../admin-detail-list'
import { AdminDetailSection } from './_component'

const meta: Meta<typeof AdminDetailSection> = {
  argTypes: {
    actions: { control: false },
    children: { control: false },
  },
  component: AdminDetailSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminDetailSection',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    actions: (
      <Button size="sm" type="button" variant="outline">
        Upravit profil
      </Button>
    ),
    children: (
      <AdminDetailList>
        <AdminDetailItem label="Autorská role">Koordinátor</AdminDetailItem>
        <AdminDetailItem label="Účet od">12. 3. 2024</AdminDetailItem>
      </AdminDetailList>
    ),
    title: 'Profil',
  },
}

// Sections that follow each other get a hairline between them.
export const Sequence: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '32px' }}>
      <AdminDetailSection title="Základní informace">
        <AdminDetailList>
          <AdminDetailItem label="Název">Jarní číslo</AdminDetailItem>
          <AdminDetailItem label="Stav">publikováno</AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>
      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">1. 4. 2026</AdminDetailItem>
          <AdminDetailItem label="Upraveno">3. 4. 2026</AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>
    </div>
  ),
}
