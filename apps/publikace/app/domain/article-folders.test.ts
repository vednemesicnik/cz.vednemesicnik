import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  type ArticleFolderKind,
  headingText,
  missingFoldersHeading,
  missingFoldersLines,
} from './article-folders.ts'
import type { HolderKind } from './artwork.ts'

/* 7:40 in Prague, as `12j` has it. */
const FOUND_AT = Temporal.Instant.from('2026-11-19T06:40:00Z')

function lines(
  missing: readonly ArticleFolderKind[],
  batches: { hasBatchAwaitingConsent?: boolean; hasBatchToResend?: boolean } = {},
  holder: HolderKind = 'article',
): string[] {
  return missingFoldersLines({
    foundAt: FOUND_AT,
    hasBatchAwaitingConsent: batches.hasBatchAwaitingConsent ?? false,
    hasBatchToResend: batches.hasBatchToResend ?? false,
    holder,
    missing,
  }).map((line) => line.replaceAll(' ', ' '))
}

describe('missingFoldersLines (12j)', () => {
  it('says under a missing Licence that consents keep being recorded', () => {
    assert.deepEqual(lines(['licences'], { hasBatchAwaitingConsent: true }), [
      'Z odkazu na nahrání děl teď nejde díla nahrát ani odeslat.',
      'Souhlasy se dál zaznamenávají.',
      'Konverzace se do složky uloží při první kontrole odpovědí po jejím návratu.',
      'Zjištěno 19. 11. v 7:40.',
    ])
  })

  it('names Licence where the step names another folder beside it', () => {
    let archive =
      'Konverzace se do složky Licence uloží při první kontrole odpovědí po jejím návratu.'
    assert.ok(lines(['artworks', 'licences'], { hasBatchAwaitingConsent: true }).includes(archive))
    assert.deepEqual(
      lines(['article', 'licences'], { hasBatchAwaitingConsent: true, hasBatchToResend: true }),
      [
        'Z odkazu na nahrání děl teď nejde díla nahrát ani odeslat.',
        'Žádost o souhlas nejde poslat znovu.',
        'Souhlasy se dál zaznamenávají.',
        archive,
        'Zjištěno 19. 11. v 7:40.',
      ],
    )
  })

  it('leaves the consents out where no batch waits for one, or Licence is there', () => {
    let isAboutConsents = (line: string) => line.startsWith('Souhlasy') || line.startsWith('Konv')
    assert.ok(!lines(['licences']).some(isAboutConsents))
    assert.ok(!lines(['licences'], { hasBatchToResend: true }).some(isAboutConsents))
    assert.ok(!lines(['artworks'], { hasBatchAwaitingConsent: true }).some(isAboutConsents))
    assert.ok(!lines(['article'], { hasBatchAwaitingConsent: true }).some(isAboutConsents))
  })
})

function heading(missing: readonly ArticleFolderKind[], holder: HolderKind): string {
  return headingText(missingFoldersHeading(missing, holder)).replaceAll('\u00a0', ' ')
}

describe('a group’s missing folders (12j)', () => {
  it('names the group’s own folder where an article’s names the article’s', () => {
    assert.equal(
      heading(['article'], 'group'),
      'Obnovte složku skupiny z koše, nebo ji vraťte na sdílený disk Publikace.',
    )
    assert.equal(
      heading(['article', 'licences'], 'group'),
      'Obnovte složku skupiny a složku Licence z koše, nebo je vraťte na sdílený disk Publikace.',
    )
    assert.equal(
      heading(['article'], 'article'),
      'Obnovte složku článku z koše, nebo ji vraťte na sdílený disk Publikace.',
    )
  })

  it('words the subfolders alike for a group and an article', () => {
    assert.equal(
      heading(['artworks', 'licences'], 'group'),
      heading(['artworks', 'licences'], 'article'),
    )
    assert.equal(heading(['licences'], 'group'), heading(['licences'], 'article'))
  })

  it('says the group’s link stopped, and the rest by the same rules', () => {
    assert.deepEqual(lines(['article'], {}, 'group'), [
      'Z odkazu skupiny teď nejde díla nahrát ani odeslat.',
      'Zjištěno 19. 11. v 7:40.',
    ])
    assert.deepEqual(lines(['artworks', 'licences'], { hasBatchAwaitingConsent: true }, 'group'), [
      'Z odkazu skupiny teď nejde díla nahrát ani odeslat.',
      'Souhlasy se dál zaznamenávají.',
      'Konverzace se do složky Licence uloží při první kontrole odpovědí po jejím návratu.',
      'Zjištěno 19. 11. v 7:40.',
    ])
  })
})
