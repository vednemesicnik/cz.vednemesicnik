// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { ActionMenu } from '~/components/action-menu'
import { ButtonLink } from '~/components/button-link'
import { CompactImageTile } from '~/components/compact-image-tile'
import { ImageTileActions } from '~/components/image-tile-actions'
import { ImageTileAltLine } from '~/components/image-tile-alt-line'
import { ImageTileFile } from '~/components/image-tile-file'
import { ImageTileMedia } from '~/components/image-tile-media'
import { ImageTileMenu } from '~/components/image-tile-menu'
import { ImageTileMessage } from '~/components/image-tile-message'
import { ImageTilePill } from '~/components/image-tile-pill'
import { TextField } from '~/components/text-field'

import { ImageTile } from './_component'

const meta: Meta<typeof ImageTile> = {
  component: ImageTile,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/ImageTile',
}

export default meta
type Story = StoryObj<typeof meta>

const menuItems = [
  { label: 'Nastavit jako hlavní', onSelect: () => {} },
  { label: 'Posunout dozadu', onSelect: () => {} },
  { label: 'Nahradit soubor', onSelect: () => {} },
  { danger: true, label: 'Odebrat', onSelect: () => {} },
]

const tileWidth = { width: '300px' }

/** A stored image: the main one, its „⋯“, the alt text and the file (24b). */
export const Playground: Story = {
  render: () => (
    <div style={tileWidth}>
      <ImageTile>
        <ImageTileMedia>
          <ImageTilePill>Hlavní</ImageTilePill>
          <ImageTileMenu>
            <ActionMenu
              items={menuItems}
              label={'Další akce obrázku 1'}
              variant={'chip'}
            />
          </ImageTileMenu>
        </ImageTileMedia>
        <TextField
          defaultValue={'Studovna městské knihovny s regály až ke stropu'}
          id={'image-tile-alt'}
          label={'Alt text'}
          placeholder={'Co je na obrázku'}
          size={'sm'}
        />
        <ImageTileFile>studovna.jpg</ImageTileFile>
      </ImageTile>
    </div>
  ),
}

/** Picked and processing: dimmed, without a „⋯“ (24b). */
export const Processing: Story = {
  render: () => (
    <div style={tileWidth}>
      <ImageTile>
        <ImageTileMedia isProcessing>
          <ImageTilePill isMuted>Zpracovává se</ImageTilePill>
        </ImageTileMedia>
        <TextField
          id={'image-tile-processing-alt'}
          label={'Alt text'}
          placeholder={'Co je na obrázku'}
          size={'sm'}
        />
        <ImageTileFile>ctenari.jpg · zpracovává se</ImageTileFile>
      </ImageTile>
    </div>
  ),
}

/** Processing failed: rose, a sentence and two ways out, no fields (24b). */
export const Failed: Story = {
  render: () => (
    <div style={tileWidth}>
      <ImageTile>
        <ImageTileMedia isFailed />
        <ImageTileMessage>
          Vyberte jiný soubor nebo obrázek odeberte — zpracování se nepodařilo.
        </ImageTileMessage>
        <ImageTileActions>
          <ButtonLink>Vybrat jiný soubor</ButtonLink>
          <ButtonLink>Odebrat</ButtonLink>
        </ImageTileActions>
        <ImageTileFile>obalka.heic</ImageTileFile>
      </ImageTile>
    </div>
  ),
}

/** A replacement that did not process: the old image stays (8kfn4ou3). */
export const ReplaceFailed: Story = {
  render: () => (
    <div style={tileWidth}>
      <ImageTile>
        <ImageTileMedia>
          <ImageTileMenu>
            <ActionMenu
              items={menuItems}
              label={'Další akce obrázku 1'}
              variant={'chip'}
            />
          </ImageTileMenu>
        </ImageTileMedia>
        <ImageTileMessage>
          Nový soubor se nepodařilo zpracovat. Původní obrázek zůstává.
        </ImageTileMessage>
        <ImageTileActions>
          <ButtonLink>Vybrat jiný soubor</ButtonLink>
        </ImageTileActions>
        <TextField
          defaultValue={'Regál s podzimními novinkami'}
          id={'image-tile-replace-alt'}
          label={'Alt text'}
          size={'sm'}
        />
        <ImageTileFile>regal.jpg</ImageTileFile>
      </ImageTile>
    </div>
  ),
}

/** The narrow column's tiles (24a): the alt's first line, or a reminder. */
export const Compact: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '10px',
        gridTemplateColumns: 'repeat(2, 130px)',
      }}
    >
      <CompactImageTile>
        <ImageTileMedia>
          <ImageTilePill>Hlavní</ImageTilePill>
        </ImageTileMedia>
        <ImageTileAltLine>Studovna městské knihovny</ImageTileAltLine>
      </CompactImageTile>
      <CompactImageTile>
        <ImageTileMedia isProcessing>
          <ImageTilePill isMuted>Zpracovává se</ImageTilePill>
        </ImageTileMedia>
        <ImageTileAltLine isMissing>Bez alt textu</ImageTileAltLine>
      </CompactImageTile>
      <CompactImageTile>
        <ImageTileMedia isFailed />
        <ImageTileAltLine isFailed>Zpracování selhalo</ImageTileAltLine>
      </CompactImageTile>
    </div>
  ),
}
