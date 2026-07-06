import { describe, expect, it } from 'vitest'
import { formatRetryAfter } from './format-retry-after'

describe('formatRetryAfter', () => {
  describe('seconds (< 60)', () => {
    it('formats 45 seconds', () => {
      expect(formatRetryAfter(45)).toBe('za 45 sekund')
    })

    it('formats 1 second', () => {
      expect(formatRetryAfter(1)).toBe('za 1 sekundu')
    })

    it('formats 59 seconds — boundary before minutes', () => {
      expect(formatRetryAfter(59)).toBe('za 59 sekund')
    })
  })

  describe('minutes (>= 60)', () => {
    it('formats 60 seconds as 1 minute', () => {
      expect(formatRetryAfter(60)).toBe('za 1 minutu')
    })

    it('rounds 61 seconds up to 2 minutes', () => {
      expect(formatRetryAfter(61)).toBe('za 2 minuty')
    })

    it('formats 900 seconds as 15 minutes', () => {
      expect(formatRetryAfter(900)).toBe('za 15 minut')
    })
  })

  describe('locale', () => {
    it('formats in English when locale is "en"', () => {
      expect(formatRetryAfter(900, 'en')).toBe('in 15 minutes')
    })
  })
})
