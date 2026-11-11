// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '~/components/button'

import { AdminDetailItem } from '../admin-detail-item'
import { AdminDetailItemLabel } from '../admin-detail-item-label'
import { AdminDetailItemValue } from '../admin-detail-item-value'
import { AdminDetailList } from '../admin-detail-list'
import { AdminDetailSectionActions } from '../admin-detail-section-actions'
import { AdminDetailSectionHead } from '../admin-detail-section-head'
import { AdminDetailSectionTitle } from '../admin-detail-section-title'
import { AdminDetailSection } from './_component'

const meta: Meta<typeof AdminDetailSection> = {
  argTypes: {
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

// A head with the title and the section's actions on its right.
export const Playground: Story = {
  args: {
    children: (
      <>
        <AdminDetailSectionHead>
          <AdminDetailSectionTitle>Profil</AdminDetailSectionTitle>
          <AdminDetailSectionActions>
            <Button size="sm" type="button" variant="outline">
              Upravit profil
            </Button>
          </AdminDetailSectionActions>
        </AdminDetailSectionHead>
        <AdminDetailList>
          <AdminDetailItem>
            <AdminDetailItemLabel>Autorská role</AdminDetailItemLabel>
            <AdminDetailItemValue>Koordinátor</AdminDetailItemValue>
          </AdminDetailItem>
          <AdminDetailItem>
            <AdminDetailItemLabel>Účet od</AdminDetailItemLabel>
            <AdminDetailItemValue>12. 3. 2024</AdminDetailItemValue>
          </AdminDetailItem>
        </AdminDetailList>
      </>
    ),
  },
}

// Sections that follow each other get a hairline between them; a title
// without actions stands on its own.
export const Sequence: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '32px' }}>
      <AdminDetailSection>
        <AdminDetailSectionTitle>Základní informace</AdminDetailSectionTitle>
        <AdminDetailList>
          <AdminDetailItem>
            <AdminDetailItemLabel>Název</AdminDetailItemLabel>
            <AdminDetailItemValue>Jarní číslo</AdminDetailItemValue>
          </AdminDetailItem>
          <AdminDetailItem>
            <AdminDetailItemLabel>Stav</AdminDetailItemLabel>
            <AdminDetailItemValue>publikováno</AdminDetailItemValue>
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>
      <AdminDetailSection>
        <AdminDetailSectionTitle>Metadata</AdminDetailSectionTitle>
        <AdminDetailList>
          <AdminDetailItem>
            <AdminDetailItemLabel>Vytvořeno</AdminDetailItemLabel>
            <AdminDetailItemValue>1. 4. 2026</AdminDetailItemValue>
          </AdminDetailItem>
          <AdminDetailItem>
            <AdminDetailItemLabel>Upraveno</AdminDetailItemLabel>
            <AdminDetailItemValue>3. 4. 2026</AdminDetailItemValue>
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>
    </div>
  ),
}
