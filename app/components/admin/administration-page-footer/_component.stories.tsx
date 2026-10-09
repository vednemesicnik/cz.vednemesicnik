// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdministrationPageFooter } from './_component'

const meta: Meta<typeof AdministrationPageFooter> = {
  component: AdministrationPageFooter,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  title: 'Administration/AdministrationPageFooter',
}

export default meta
type Story = StoryObj<typeof meta>

// One link to the website's front page; a screen reader also hears
// „(otevře se v nové záložce)“.
export const Playground: Story = {}
