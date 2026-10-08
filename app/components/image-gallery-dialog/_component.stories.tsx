// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useRef, useState } from 'react'

import type { ImageSources } from '~/utils/image-store/create-image-sources'
import { type GalleryImage, ImageGalleryDialog } from './_component'

const createStaticSources = (
  src: string,
  width: number,
  height: number,
): ImageSources => ({
  avifSrcSet: undefined,
  height,
  placeholder: src,
  src,
  srcSet: `${src} ${width}w`,
  width,
})

const images: Array<GalleryImage> = [
  {
    alt: 'Kavárna s dlouhým stolem u okna',
    description: (
      <p>Tichá místnost v Café Záhorská. Telefonovat se chodí na chodbu.</p>
    ),
    id: 'landscape',
    sources: createStaticSources('/images/article-link-image.jpeg', 96, 54),
  },
  {
    alt: 'Obálka tištěného čísla',
    description: <p>Schody do patra U Kance. Nahoře se sedí do půlnoci.</p>,
    id: 'portrait',
    sources: createStaticSources('/images/issue-cover.jpeg', 110, 154),
  },
  {
    alt: 'Obálka podcastu',
    id: 'square',
    sources: createStaticSources('/images/podcast-cover.jpeg', 110, 117),
  },
]

type DemoProps = {
  images: Array<GalleryImage>
  initialIndex?: number
}

// Opens the dialog on mount; the button reopens it after a close.
const OpenDialog = ({ images, initialIndex = 0 }: DemoProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <>
      <button onClick={() => dialogRef.current?.showModal()} type={'button'}>
        Otevřít galerii
      </button>
      <ImageGalleryDialog
        images={images}
        index={index}
        onIndexChange={setIndex}
        ref={dialogRef}
      />
    </>
  )
}

const meta: Meta<typeof OpenDialog> = {
  component: OpenDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/ImageGalleryDialog',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    images,
  },
}

/** The last image, in portrait: → pages round to *1 z 3* (m8ei8fno). */
export const LastPortraitImage: Story = {
  args: {
    images: [images[0], images[2], images[1]].filter(
      (image) => image !== undefined,
    ),
    initialIndex: 2,
  },
}

/** A single image: *1 z 1* and no arrows. */
export const SingleImage: Story = {
  args: {
    images: images.slice(0, 1),
  },
}
