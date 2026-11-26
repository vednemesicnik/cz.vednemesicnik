// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { EditorDetailRowName } from '~/components/editor-detail-row-name'
import { EditorDetailRowThumbnail } from '~/components/editor-detail-row-thumbnail'
import { EditorDetailRowThumbnails } from '~/components/editor-detail-row-thumbnails'
import { EditorDetailRowValue } from '~/components/editor-detail-row-value'

import { EditorDetailRow } from './_component'

const meta: Meta<typeof EditorDetailRow> = {
  component: EditorDetailRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/EditorDetailRow',
}

export default meta
type Story = StoryObj<typeof meta>

const phoneWidth = { padding: '0 16px', width: '358px' }

export const Playground: Story = {
  args: {
    children: (
      <>
        <EditorDetailRowName>Adresa</EditorDetailRowName>
        <EditorDetailRowValue>deset-knih-na-podzim</EditorDetailRowValue>
      </>
    ),
  },
  render: (args) => (
    <div style={phoneWidth}>
      <EditorDetailRow {...args} />
    </div>
  ),
}

/** The phone editor's details as 24f draws them. */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ ...phoneWidth, display: 'flex', flexDirection: 'column' }}>
      <EditorDetailRow>
        <EditorDetailRowName>Adresa</EditorDetailRowName>
        <EditorDetailRowValue>deset-knih-na-podzim</EditorDetailRowValue>
      </EditorDetailRow>
      <EditorDetailRow>
        <EditorDetailRowName>Autoři</EditorDetailRowName>
        <EditorDetailRowValue>Jakub Novák</EditorDetailRowValue>
      </EditorDetailRow>
      <EditorDetailRow>
        <EditorDetailRowName>Rubriky</EditorDetailRowName>
        <EditorDetailRowValue>Kultura +2</EditorDetailRowValue>
      </EditorDetailRow>
      <EditorDetailRow>
        <EditorDetailRowName>Štítky</EditorDetailRowName>
        <EditorDetailRowValue>
          podzim, čtení, knihovna, doporučujeme, osnovy
        </EditorDetailRowValue>
      </EditorDetailRow>
      <EditorDetailRow>
        <EditorDetailRowName>Obrázky</EditorDetailRowName>
        <EditorDetailRowValue>
          <EditorDetailRowThumbnails>
            <EditorDetailRowThumbnail
              source={'/images/article-link-image.jpeg'}
            />
            <EditorDetailRowThumbnail source={'/images/issue-cover.jpeg'} />
            <EditorDetailRowThumbnail
              source={'/images/article-link-author-image.jpeg'}
            />
          </EditorDetailRowThumbnails>
          4 · nahrává se: 1
        </EditorDetailRowValue>
      </EditorDetailRow>
    </div>
  ),
}
