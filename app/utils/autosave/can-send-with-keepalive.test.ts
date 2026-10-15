import { describe, expect, test } from 'vitest'

import { canSendWithKeepalive } from './can-send-with-keepalive'

describe('canSendWithKeepalive', () => {
  test('a text-only save under the limit can go', () => {
    const formData = new FormData()
    formData.append('content', '<p>Text</p>')

    expect(canSendWithKeepalive(formData)).toBe(true)
  })

  test('a save with a file cannot', () => {
    const formData = new FormData()
    formData.append('images[0].file', new File(['image'], 'image.png'))

    expect(canSendWithKeepalive(formData)).toBe(false)
  })

  test('a save over the limit cannot, counted in UTF-8 bytes', () => {
    const formData = new FormData()
    // 2 bytes each in UTF-8: 31 000 characters are over 60 KB.
    formData.append('content', 'ř'.repeat(31_000))

    expect(canSendWithKeepalive(formData)).toBe(false)
  })
})
