import { describe, expect, it } from 'vitest'

import { getRateLimitSubject } from './get-rate-limit-subject.server'

describe('getRateLimitSubject', () => {
  it.each([
    ['2001:db8:83a0:1234:1::1', '2001:db8:83a0:1234::/64'],
    ['2001:db8:83a0:1234:ffff:ffff:ffff:ffff', '2001:db8:83a0:1234::/64'],
    ['2001:DB8:83A0:1234::1', '2001:db8:83a0:1234::/64'],
    ['2001:0db8:0000:00ab::1', '2001:db8:0:ab::/64'],
    ['2001:db8::1', '2001:db8:0:0::/64'],
    ['2001:db8::', '2001:db8:0:0::/64'],
    ['::1', '0:0:0:0::/64'],
  ])('counts %s as %s', (address, subject) => {
    expect(getRateLimitSubject(address)).toBe(subject)
  })

  it.each(['198.51.100.1', '::ffff:198.51.100.1', 'unknown'])(
    'keeps %s as it is',
    (address) => {
      expect(getRateLimitSubject(address)).toBe(address)
    },
  )
})
