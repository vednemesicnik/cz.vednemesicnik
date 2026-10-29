import { describe, expect, test } from 'vitest'

import { getUnpublishedPodcastAdvice } from './get-unpublished-podcast-advice'

describe('getUnpublishedPodcastAdvice', () => {
  test('an author waits for the Coordinator', () => {
    expect(
      getUnpublishedPodcastAdvice({ isApprover: false, podcastState: 'draft' }),
    ).toBe(
      'Epizodu můžete odeslat ke schválení, až Koordinátor publikuje podcast.',
    )
    expect(
      getUnpublishedPodcastAdvice({
        isApprover: false,
        podcastState: 'archived',
      }),
    ).toBe(
      'Epizodu můžete odeslat ke schválení, až Koordinátor publikuje podcast.',
    )
  })

  test('the Coordinator publishes a draft podcast first', () => {
    expect(
      getUnpublishedPodcastAdvice({ isApprover: true, podcastState: 'draft' }),
    ).toBe(
      'Nejprve publikujte podcast. Pak lze epizodu odeslat ke schválení nebo publikovat.',
    )
  })

  test('the Coordinator restores and publishes an archived podcast first', () => {
    expect(
      getUnpublishedPodcastAdvice({
        isApprover: true,
        podcastState: 'archived',
      }),
    ).toBe(
      'Nejprve obnovte podcast jako koncept a publikujte ho. Pak lze epizodu odeslat ke schválení nebo publikovat.',
    )
  })
})
