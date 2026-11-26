import { describe, expect, test } from 'vitest'

import { flashSignInNotice } from './flash-sign-in-notice.server'
import { readSignInNotice } from './read-sign-in-notice.server'

const requestWith = (setCookie: string) =>
  new Request('https://test.local/administration/sign-in', {
    headers: { Cookie: setCookie.split(';')[0] },
  })

describe('readSignInNotice', () => {
  test('reads nothing without the cookie', async () => {
    const { notice } = await readSignInNotice(
      new Request('https://test.local/administration/sign-in'),
    )

    expect(notice).toBeNull()
  })

  test('reads the flashed notice once', async () => {
    const flashed = await flashSignInNotice(
      new Request('https://test.local/administration/sign-in/magic-link'),
      { email: 'jakub.novak@vednemesicnik.cz', kind: 'magic-link-sent' },
    )

    const first = await readSignInNotice(requestWith(flashed))
    expect(first.notice).toEqual({
      email: 'jakub.novak@vednemesicnik.cz',
      kind: 'magic-link-sent',
    })

    const second = await readSignInNotice(requestWith(first.setCookie))
    expect(second.notice).toBeNull()
  })
})
