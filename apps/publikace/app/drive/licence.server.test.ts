import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { fitPreview, imageSize, licenceHtml, type LicenceDetails } from './licence.server.ts'

function bytes(...parts: (number | number[])[]): Uint8Array<ArrayBuffer> {
  return new Uint8Array(parts.flat())
}

function u32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]
}

function u16(value: number): number[] {
  return [(value >>> 8) & 0xff, value & 0xff]
}

function le16(value: number): number[] {
  return [value & 0xff, (value >>> 8) & 0xff]
}

/** The signature and the IHDR chunk of a PNG, as Drive's thumbnail of a PNG artwork starts. */
function png(width: number, height: number): Uint8Array<ArrayBuffer> {
  return bytes(
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    u32(13),
    [0x49, 0x48, 0x44, 0x52],
    u32(width),
    u32(height),
    [8, 6, 0, 0, 0],
  )
}

/** A JPEG with an APP0 segment before its baseline frame, the size sitting in the frame. */
function jpeg(width: number, height: number): Uint8Array<ArrayBuffer> {
  return bytes(
    [0xff, 0xd8],
    [0xff, 0xe0],
    u16(16),
    [0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0],
    [0xff, 0xc0],
    u16(17),
    [8],
    u16(height),
    u16(width),
    [3],
  )
}

function details(preview: LicenceDetails['preview']): LicenceDetails {
  return {
    author: 'Testovací Autorka',
    preview,
    providerEmail: 'jana.novakova@external.test',
    providerName: 'Jana Nováková',
    source: 'https://external.test/dilo',
    storedName: 'abc123.png',
  }
}

describe('the licence preview', () => {
  it('reads the size from the headers of PNG, JPEG, GIF and WebP', () => {
    assert.deepEqual(imageSize(png(800, 600)), { height: 600, width: 800 })
    assert.deepEqual(imageSize(jpeg(600, 800)), { height: 800, width: 600 })
    assert.deepEqual(imageSize(bytes([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], le16(320), le16(200))), {
      height: 200,
      width: 320,
    })
    let webp = bytes(
      [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
      [0x56, 0x50, 0x38, 0x58, 10, 0, 0, 0, 0, 0, 0, 0],
      [0x1f, 0x03, 0x00],
      [0x57, 0x02, 0x00],
    )
    assert.deepEqual(imageSize(webp), { height: 600, width: 800 })
  })

  it('knows no size for bytes it cannot read', () => {
    assert.equal(imageSize(bytes([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])), null)
    assert.equal(imageSize(bytes([0x49, 0x49, 0x2a, 0x00])), null)
    assert.equal(imageSize(bytes([])), null)
  })

  it('fits into 400 by 320 with its proportions, and never grows', () => {
    assert.deepEqual(fitPreview({ height: 800, width: 800 }), { height: 320, width: 320 })
    assert.deepEqual(fitPreview({ height: 600, width: 800 }), { height: 300, width: 400 })
    assert.deepEqual(fitPreview({ height: 800, width: 600 }), { height: 320, width: 240 })
    assert.deepEqual(fitPreview({ height: 100, width: 200 }), { height: 100, width: 200 })
  })

  /*
   * Drive's HTML import ignores `max-width` and `max-height`: with only those, an 800 px
   * thumbnail fills a page of its own and the licence runs to two pages.
   */
  it('draws the preview with width and height attributes, and no CSS the import ignores', () => {
    let html = licenceHtml(details({ bytes: png(800, 800), mimeType: 'image/png' }))
    assert.match(html, /<img src="data:image\/png;base64,[^"]+" width="320" height="320" alt="">/)
    assert.doesNotMatch(html, /max-width|max-height/)
  })

  it('bounds a preview of unknown size by its width alone', () => {
    let html = licenceHtml(details({ bytes: bytes([1, 2, 3]), mimeType: 'image/png' }))
    assert.match(html, /<img src="data:image\/png;base64,[^"]+" width="400" alt="">/)
  })

  it('says so when there is no preview', () => {
    assert.match(licenceHtml(details(null)), /\[Náhled není k dispozici\]/)
  })
})
