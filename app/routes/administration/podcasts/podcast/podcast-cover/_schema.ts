import { z } from 'zod'

/**
 * One upload of the podcast's cover, saved on its own (design 27e). A podcast
 * needs a cover, so it is replaced, never removed.
 */
export const schema = z.object({
  // The editor's tab, which holds the edit hold (design 24g).
  editTabId: z.string().min(1),
  file: z.instanceof(File),
  intent: z.literal('upload'),
})
