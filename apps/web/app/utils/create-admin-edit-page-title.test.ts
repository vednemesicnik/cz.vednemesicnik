import { describe, expect, it } from 'vitest'
import { createAdminEditPageTitle } from './create-admin-edit-page-title'

describe('createAdminEditPageTitle', () => {
  it('should follow the record name with — úprava', () => {
    const result = createAdminEditPageTitle('Kultura')
    expect(result).toBe('Kultura — úprava | Administrace | Vedneměsíčník')
  })
})
