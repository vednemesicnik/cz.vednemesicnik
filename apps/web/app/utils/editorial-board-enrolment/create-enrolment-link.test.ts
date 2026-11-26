import { describe, expect, it } from 'vitest'

import { createEnrolmentLink } from './create-enrolment-link'

describe('createEnrolmentLink', () => {
  it('carries the token and nothing else', () => {
    expect(
      createEnrolmentLink({ baseUrl: 'https://local.dev', token: 'a-b_c' }),
    ).toBe('https://local.dev/editorial-board/enrolment/confirm?token=a-b_c')
  })
})
