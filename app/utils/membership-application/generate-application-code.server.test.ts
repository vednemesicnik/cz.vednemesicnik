import { describe, expect, it } from 'vitest'

import { generateApplicationCode } from './generate-application-code.server'

describe('generateApplicationCode', () => {
  it('matches the pattern the script accepts', () => {
    expect(generateApplicationCode()).toMatch(/^VDM-[0-9A-Z]{4}-[0-9A-Z]{2}$/)
  })

  it('leaves out the characters that get mixed up', () => {
    const codes = Array.from({ length: 200 }, generateApplicationCode).join('')
    expect(codes.replace(/VDM-/g, '')).not.toMatch(/[01ILO]/)
  })
})
