import { describe, expect, it } from 'vitest'

import { generateRequestId } from './generate-request-id.server'

describe('generateRequestId', () => {
  it('makes the year and six characters without 0/O and 1/I/L', () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      expect(generateRequestId('2025')).toMatch(
        /^2025-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/,
      )
    }
  })
})
