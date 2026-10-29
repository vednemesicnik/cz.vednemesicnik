import { invariantResponse } from '@epic-web/invariant'

/**
 * Reads the bulk publish dialog's date choice (design 22c): `today` is the
 * server's now, so a browser clock running ahead can't make it a future date;
 * another day comes as that day at the moment of confirmation, as in 23f.
 *
 * @param formData - The submitted form.
 * @returns The top record's publish moment.
 */
export const readBulkPublishBase = (formData: FormData) => {
  if (formData.get('publishDate') === 'today') return new Date()

  const publishedAt = formData.get('publishedAt')
  invariantResponse(
    typeof publishedAt === 'string' && publishedAt !== '',
    'Missing publishedAt',
  )
  const base = new Date(publishedAt)
  invariantResponse(!Number.isNaN(base.getTime()), 'Invalid publishedAt')

  return base
}
