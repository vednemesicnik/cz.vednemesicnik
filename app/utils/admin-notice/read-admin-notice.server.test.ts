import { describe, expect, test } from 'vitest'

import { flashAdminNotice } from './flash-admin-notice.server'
import { readAdminNotice } from './read-admin-notice.server'

const requestWith = (setCookie: string) =>
  new Request('https://test.local/administration/articles', {
    headers: { Cookie: setCookie.split(';')[0] },
  })

describe('readAdminNotice', () => {
  test('reads nothing without the cookie', async () => {
    const { toast } = await readAdminNotice(
      new Request('https://test.local/administration/articles'),
    )

    expect(toast).toBeNull()
  })

  test('reads the flashed toast once', async () => {
    const flashed = await flashAdminNotice(
      new Request('https://test.local/administration/articles/a1'),
      'Smazáno',
    )

    const first = await readAdminNotice(requestWith(flashed))
    expect(first.toast).toBe('Smazáno')

    const second = await readAdminNotice(requestWith(first.setCookie))
    expect(second.toast).toBeNull()
  })
})
