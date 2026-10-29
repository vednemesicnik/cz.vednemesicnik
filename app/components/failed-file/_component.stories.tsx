// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { ButtonLink } from '~/components/button-link'
import { ErrorMessage } from '~/components/error-message'

import { FailedFile } from './_component'

const meta: Meta<typeof FailedFile> = {
  component: FailedFile,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/FailedFile',
}

export default meta
type Story = StoryObj<typeof meta>

/** An upload that failed: the file stays picked, with *Zkusit znovu* (26d). */
export const Playground: Story = {
  args: {
    fileName: 'obalka-podcastu.jpg',
  },
  render: (args) => (
    <div style={{ width: '220px' }}>
      <FailedFile {...args}>
        <ErrorMessage>
          Zkuste soubor nahrát znovu — nahrání se nepovedlo.
        </ErrorMessage>
        <ButtonLink type={'button'}>Zkusit znovu</ButtonLink>
      </FailedFile>
    </div>
  ),
}

/** An image over 40 megapixels: only another file helps (4al3quzt). */
export const OverPixelBudget: Story = {
  args: {
    fileName: 'obalka-podcastu.png',
  },
  render: (args) => (
    <div style={{ width: '220px' }}>
      <FailedFile {...args}>
        <ErrorMessage>
          Zmenšete rozlišení obrázku nebo vyberte jiný — tento má více než 40
          megapixelů.
        </ErrorMessage>
        <ButtonLink type={'button'}>Vybrat jiný soubor</ButtonLink>
      </FailedFile>
    </div>
  ),
}
