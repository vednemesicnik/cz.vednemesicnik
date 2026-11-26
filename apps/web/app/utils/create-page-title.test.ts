import { describe, expect, it } from 'vitest'
import { createPageTitle } from './create-page-title'

describe('createPageTitle', () => {
  it('should return site name when title is undefined', () => {
    const result = createPageTitle(undefined)
    expect(result).toBe('Vedneměsíčník')
  })

  it('should return site name when no argument is provided', () => {
    const result = createPageTitle()
    expect(result).toBe('Vedneměsíčník')
  })

  it('should append site name to title with separator', () => {
    const result = createPageTitle('Články')
    expect(result).toBe('Články | Vedneměsíčník')
  })

  it('should return site name when title is empty string', () => {
    const result = createPageTitle('')
    expect(result).toBe('Vedneměsíčník')
  })

  it('should handle title with special characters', () => {
    const result = createPageTitle('Články & Podcasty')
    expect(result).toBe('Články & Podcasty | Vedneměsíčník')
  })

  it('should handle title with Czech diacritics', () => {
    const result = createPageTitle('Redakční rada')
    expect(result).toBe('Redakční rada | Vedneměsíčník')
  })

  it('should handle long title', () => {
    const longTitle = 'Velmi dlouhý název stránky s mnoha slovy'
    const result = createPageTitle(longTitle)
    expect(result).toBe(`${longTitle} | Vedneměsíčník`)
  })
})
