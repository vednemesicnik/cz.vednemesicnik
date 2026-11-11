// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { ActionMenu } from '~/components/action-menu'
import { ActionMenuItem } from '~/components/action-menu-item'
import { ButtonLink } from '~/components/button-link'
import { CompactImageTile } from '~/components/compact-image-tile'
import { CompactUploadStatus } from '~/components/compact-upload-status'
import { ImageTileActions } from '~/components/image-tile-actions'
import { ImageTileAltLine } from '~/components/image-tile-alt-line'
import { ImageTileFile } from '~/components/image-tile-file'
import { ImageTileMedia } from '~/components/image-tile-media'
import { ImageTileMenu } from '~/components/image-tile-menu'
import { ImageTileMessage } from '~/components/image-tile-message'
import { ImageTileOrder } from '~/components/image-tile-order'
import { ImageTilePill } from '~/components/image-tile-pill'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldLabel } from '~/components/text-field-label'
import { UploadStatus } from '~/components/upload-status'

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

const menuItems = (
  <>
    <ActionMenuItem onSelect={() => {}}>Nastavit jako hlavní</ActionMenuItem>
    <ActionMenuItem onSelect={() => {}}>Posunout dozadu</ActionMenuItem>
    <ActionMenuItem onSelect={() => {}}>Nahradit soubor</ActionMenuItem>
    <ActionMenuItem danger={true} onSelect={() => {}}>
      Odebrat
    </ActionMenuItem>
  </>
)

const tileWidth = { width: '300px' }

/**
 * The main image: first, its number without a grip, its „⋯“, the alt text and
 * the file (24b, yj2t50dd).
 */
export const Playground: Story = {
  render: () => (
    <div style={tileWidth}>
      <ImageTile>
        <ImageTileMedia>
          <ImageTileOrder>{1}</ImageTileOrder>
          <ImageTilePill>Hlavní</ImageTilePill>
          <ImageTileMenu>
            <ActionMenu label={'Další akce obrázku 1'} variant={'chip'}>
              {menuItems}
            </ActionMenu>
          </ImageTileMenu>
        </ImageTileMedia>
        <TextField id={'image-tile-alt'} size={'sm'}>
          <TextFieldLabel>Alt text</TextFieldLabel>
          <TextFieldControl
            defaultValue={'Studovna městské knihovny s regály až ke stropu'}
            placeholder={'Co je na obrázku'}
          />
        </TextField>
        <ImageTileFile>studovna.jpg</ImageTileFile>
      </ImageTile>
    </div>
  ),
}

/**
 * Picked and uploading: lightened, without a number or „⋯“; the upload row
 * under the preview (24b, bxy8xxqs).
 */
export const Uploading: Story = {
  render: () => (
    <div style={tileWidth}>
      <ImageTile>
        <ImageTileMedia isUploading />
        <UploadStatus
          cancelLabel={'Zrušit nahrávání ctenari.jpg'}
          onCancel={() => {}}
        />
        <TextField id={'image-tile-uploading-alt'} size={'sm'}>
          <TextFieldLabel>Alt text</TextFieldLabel>
          <TextFieldControl placeholder={'Co je na obrázku'} />
        </TextField>
        <ImageTileFile>ctenari.jpg</ImageTileFile>
      </ImageTile>
    </div>
  ),
}

/**
 * A stored image that can be dragged, and the same tile taken hold of: a card
 * with its grip coloured (24b „Během přetažení“, as 22c).
 */
export const Draggable: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: '32px' }}>
      {[false, true].map((isLifted) => (
        <div key={String(isLifted)} style={tileWidth}>
          <ImageTile isLifted={isLifted}>
            <ImageTileMedia>
              <ImageTileOrder hasGrip>{2}</ImageTileOrder>
              <ImageTileMenu>
                <ActionMenu label={'Další akce obrázku 2'} variant={'chip'}>
                  {menuItems}
                </ActionMenu>
              </ImageTileMenu>
            </ImageTileMedia>
            <TextField id={`image-tile-draggable-alt-${isLifted}`} size={'sm'}>
              <TextFieldLabel>Alt text</TextFieldLabel>
              <TextFieldControl defaultValue={'Čtenáři u okna'} />
            </TextField>
            <ImageTileFile>ctenari.jpg</ImageTileFile>
          </ImageTile>
        </div>
      ))}
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
          <ImageTileOrder hasGrip>{2}</ImageTileOrder>
          <ImageTileMenu>
            <ActionMenu label={'Další akce obrázku 2'} variant={'chip'}>
              {menuItems}
            </ActionMenu>
          </ImageTileMenu>
        </ImageTileMedia>
        <ImageTileMessage>
          Nový soubor se nepodařilo zpracovat. Původní obrázek zůstává.
        </ImageTileMessage>
        <ImageTileActions>
          <ButtonLink>Vybrat jiný soubor</ButtonLink>
        </ImageTileActions>
        <TextField id={'image-tile-replace-alt'} size={'sm'}>
          <TextFieldLabel>Alt text</TextFieldLabel>
          <TextFieldControl defaultValue={'Regál s podzimními novinkami'} />
        </TextField>
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
          <ImageTileOrder>{1}</ImageTileOrder>
          <ImageTilePill>Hlavní</ImageTilePill>
        </ImageTileMedia>
        <ImageTileAltLine>Studovna městské knihovny</ImageTileAltLine>
      </CompactImageTile>
      <CompactImageTile>
        <ImageTileMedia isUploading />
        <CompactUploadStatus />
      </CompactImageTile>
      <CompactImageTile>
        <ImageTileMedia>
          <ImageTileOrder>{2}</ImageTileOrder>
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
