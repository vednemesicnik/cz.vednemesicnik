import { describe, expect, it } from 'vitest'

import { getRateLimitSubject } from './get-rate-limit-subject.server'

describe('getRateLimitSubject', () => {
  it.each([
    ['2a00:1028:83a0:1234:1::1', '2a00:1028:83a0:1234::/64'],
    ['2a00:1028:83a0:1234:ffff:ffff:ffff:ffff', '2a00:1028:83a0:1234::/64'],
    ['2A00:1028:83A0:1234::1', '2a00:1028:83a0:1234::/64'],
    ['2a00:0db8:0000:00ab::1', '2a00:db8:0:ab::/64'],
    ['2a00:1028::1', '2a00:1028:0:0::/64'],
    ['2a00:1028::', '2a00:1028:0:0::/64'],
    ['::1', '0:0:0:0::/64'],
  ])('counts %s as %s', (address, subject) => {
    expect(getRateLimitSubject(address)).toBe(subject)
  })

  it.each(['84.42.1.1', '::ffff:84.42.1.1', 'unknown'])(
    'keeps %s as it is',
    (address) => {
      expect(getRateLimitSubject(address)).toBe(address)
    },
  )
})
