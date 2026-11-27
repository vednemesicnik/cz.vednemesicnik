import { describe, expect, test } from 'vitest'

import {
  type AppFacts,
  allowedSemvers,
  decideRelease,
  formatNotes,
  newestTag,
  nextDateTag,
  parseNamedVersions,
  pragueDate,
  RELEASE_STYLES,
  unstyledApps,
} from './release-version.ts'

const semverFacts = (overrides: Partial<AppFacts> = {}): AppFacts => ({
  app: 'publikace',
  changed: true,
  date: '2026-11-27',
  existing: undefined,
  kind: 'release',
  named: [],
  style: { latest: false, style: 'semver' },
  tags: [],
  ...overrides,
})

const dateFacts = (overrides: Partial<AppFacts> = {}): AppFacts => ({
  app: 'web',
  changed: true,
  date: '2026-11-27',
  existing: undefined,
  kind: 'release',
  named: [],
  style: { latest: true, style: 'date' },
  tags: [],
  ...overrides,
})

describe('parseNamedVersions', () => {
  test('reads the list under ## Versions', () => {
    const body = [
      '## Summary',
      '- publikace-v9.9.9',
      '## Versions',
      '- publikace-v1.1.0',
      '* `web-v2.0.0`',
      'prose that is not a version',
      '## Deploy expectation',
      '- publikace-v3.0.0',
    ].join('\n')

    expect(parseNamedVersions(body)).toEqual([
      { app: 'publikace', version: '1.1.0' },
      { app: 'web', version: '2.0.0' },
    ])
  })

  test('leaves out what an HTML comment says', () => {
    const body = '## Versions\n<!-- e.g.\n- publikace-v1.0.0\n-->\n'
    expect(parseNamedVersions(body)).toEqual([])
  })

  test('reads an empty body, which GitHub sends as null', () => {
    expect(parseNamedVersions(null)).toEqual([])
  })

  test('keeps a hyphenated application name whole', () => {
    expect(parseNamedVersions('## Versions\r\n- new-app-v1.0.0\r\n')).toEqual([
      { app: 'new-app', version: '1.0.0' },
    ])
  })
})

describe('newestTag', () => {
  test('orders semver tags by number, not by text', () => {
    const tags = ['publikace-v1.9.0', 'publikace-v1.10.0', 'publikace-v1.2.0']
    expect(newestTag('publikace', RELEASE_STYLES.publikace, tags)).toBe(
      'publikace-v1.10.0',
    )
  })

  test('orders same-day date tags by number', () => {
    const tags = ['web-2026-11-27-9', 'web-2026-11-27-10', 'web-2026-11-26']
    expect(newestTag('web', RELEASE_STYLES.web, tags)).toBe('web-2026-11-27-10')
  })

  test('ignores tags of another shape', () => {
    expect(
      newestTag('web', RELEASE_STYLES.web, ['web-admin-2026-11-27', 'web-v1']),
    ).toBeUndefined()
  })
})

describe('nextDateTag', () => {
  test('takes the day, then numbers the next ones that day', () => {
    expect(nextDateTag('web', [], '2026-11-27')).toBe('web-2026-11-27')
    expect(nextDateTag('web', ['web-2026-11-27'], '2026-11-27')).toBe(
      'web-2026-11-27-2',
    )
    expect(
      nextDateTag(
        'web',
        ['web-2026-11-27', 'web-2026-11-27-10', 'web-2026-11-27-9'],
        '2026-11-27',
      ),
    ).toBe('web-2026-11-27-11')
  })

  test('starts a new day without a number', () => {
    expect(nextDateTag('web', ['web-2026-11-26-3'], '2026-11-27')).toBe(
      'web-2026-11-27',
    )
  })
})

describe('allowedSemvers', () => {
  test('allows the next patch, minor and major', () => {
    expect(allowedSemvers('1.2.3')).toEqual(['1.2.4', '1.3.0', '2.0.0'])
  })

  test('allows only 1.0.0 as the first version', () => {
    expect(allowedSemvers(undefined)).toEqual(['1.0.0'])
  })
})

describe('decideRelease, semver', () => {
  test('stays untagged until a release names the first version', () => {
    expect(decideRelease(semverFacts()).action).toBe('skip')
  })

  test('tags the first version when it is named, even if only the host changed', () => {
    expect(
      decideRelease(semverFacts({ changed: false, named: ['1.0.0'] })),
    ).toEqual({
      action: 'tag',
      app: 'publikace',
      previous: undefined,
      tag: 'publikace-v1.0.0',
    })
  })

  test('refuses a first version other than 1.0.0', () => {
    expect(decideRelease(semverFacts({ named: ['0.1.0'] })).action).toBe('fail')
  })

  test('tags the version a release names', () => {
    expect(
      decideRelease(
        semverFacts({ named: ['1.1.0'], tags: ['publikace-v1.0.0'] }),
      ),
    ).toMatchObject({ previous: 'publikace-v1.0.0', tag: 'publikace-v1.1.0' })
  })

  test('refuses a version that does not follow the newest tag', () => {
    const decision = decideRelease(
      semverFacts({ named: ['1.2.0'], tags: ['publikace-v1.0.0'] }),
    )
    expect(decision).toMatchObject({ action: 'fail' })
    expect(decision.action === 'fail' && decision.reason).toContain(
      'publikace-v1.0.1, publikace-v1.1.0, publikace-v2.0.0',
    )
  })

  test('refuses a changed application whose version is not named', () => {
    expect(
      decideRelease(semverFacts({ tags: ['publikace-v1.0.0'] })).action,
    ).toBe('fail')
  })

  test('refuses a version named for an unchanged application', () => {
    expect(
      decideRelease(
        semverFacts({
          changed: false,
          named: ['1.0.1'],
          tags: ['publikace-v1.0.0'],
        }),
      ).action,
    ).toBe('fail')
  })

  test('skips an unchanged application nobody named', () => {
    expect(
      decideRelease(semverFacts({ changed: false, tags: ['publikace-v1.0.0'] }))
        .action,
    ).toBe('skip')
  })

  test('refuses two versions of one application', () => {
    expect(
      decideRelease(
        semverFacts({ named: ['1.0.1', '1.1.0'], tags: ['publikace-v1.0.0'] }),
      ).action,
    ).toBe('fail')
  })

  test('gives a hotfix the next patch without asking', () => {
    expect(
      decideRelease(
        semverFacts({ kind: 'hotfix', tags: ['publikace-v1.4.2'] }),
      ),
    ).toMatchObject({ action: 'tag', tag: 'publikace-v1.4.3' })
  })

  test('gives a hotfix no first version', () => {
    expect(decideRelease(semverFacts({ kind: 'hotfix' })).action).toBe('skip')
  })

  test('hands back a tag already on the commit, so a re-run publishes its Release', () => {
    expect(
      decideRelease(
        semverFacts({
          changed: false,
          existing: 'publikace-v1.1.0',
          tags: ['publikace-v1.0.0'],
        }),
      ),
    ).toEqual({
      action: 'tag',
      app: 'publikace',
      previous: 'publikace-v1.0.0',
      tag: 'publikace-v1.1.0',
    })
  })
})

describe('decideRelease, date', () => {
  test('tags a changed application with the day', () => {
    expect(decideRelease(dateFacts())).toMatchObject({
      action: 'tag',
      tag: 'web-2026-11-27',
    })
  })

  test('skips an unchanged one', () => {
    expect(
      decideRelease(dateFacts({ changed: false, tags: ['web-2026-11-20'] })),
    ).toMatchObject({
      action: 'skip',
      reason: 'unchanged since web-2026-11-20',
    })
  })

  test('refuses a named version', () => {
    expect(decideRelease(dateFacts({ named: ['1.0.0'] })).action).toBe('fail')
  })
})

describe('formatNotes', () => {
  test('lists the commits and mentions nobody', () => {
    expect(
      formatNotes(
        [
          {
            hash: 'abc1234',
            subject: 'build(deps): bump @simplewebauthn/server',
          },
          { hash: 'def5678', subject: 'fix: keep `@types/node` (#12)' },
        ],
        'none',
      ),
    ).toBe(
      '- build(deps): bump `@simplewebauthn/server` (abc1234)\n' +
        '- fix: keep `@types/node` (#12) (def5678)\n',
    )
  })

  test('writes the fallback line when no commit touched the folder', () => {
    expect(formatNotes([], 'No commit.')).toBe('No commit.\n')
  })
})

describe('pragueDate', () => {
  test('counts the day in Prague, not in UTC', () => {
    expect(pragueDate(new Date('2026-11-26T23:30:00Z'))).toBe('2026-11-27')
    expect(pragueDate(new Date('2026-07-01T21:59:00Z'))).toBe('2026-07-01')
    expect(pragueDate(new Date('2026-07-01T22:00:00Z'))).toBe('2026-07-02')
  })
})

describe('unstyledApps', () => {
  test('names a folder without a style', () => {
    expect(unstyledApps(['publikace', 'shop', 'web'])).toEqual(['shop'])
  })
})
