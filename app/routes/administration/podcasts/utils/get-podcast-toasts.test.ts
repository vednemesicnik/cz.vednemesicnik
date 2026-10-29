import { describe, expect, test } from 'vitest'

import { FORM_CONFIG } from '~/config/form-config'

import { getPodcastToasts } from './get-podcast-toasts'

const RETRACT = FORM_CONFIG.intent.value.retract

describe('getPodcastToasts (27b, gzumlpu2)', () => {
  test('a podcast with published episodes says they went too', () => {
    expect(getPodcastToasts(11)[RETRACT]).toBe(
      'Podcast stažen z publikace. Z webu zmizely i jeho publikované epizody.',
    )
  })

  test('a podcast without them says only that it was retracted', () => {
    expect(getPodcastToasts(0)[RETRACT]).toBe('Podcast stažen z publikace.')
  })
})
