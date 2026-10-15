import { describe, expect, it } from 'vitest'
import { createAdminPageTitle } from './create-admin-page-title'

describe('createAdminPageTitle', () => {
  it('should put the text first, then Administrace and the site name', () => {
    const result = createAdminPageTitle('Články')
    expect(result).toBe('Články | Administrace | Vedneměsíčník')
  })
})
