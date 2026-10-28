import { z } from 'zod'

/**
 * One change of the podcast's cover, saved on its own (design 27e). A podcast
 * needs a cover, so the editor replaces it, never removes it: a removal is
 * only the compensation for a cancelled first cover (log 0029).
 */
export const schema = z.intersection(
  z.discriminatedUnion('intent', [
    z.object({ file: z.instanceof(File), intent: z.literal('upload') }),
    z.object({ intent: z.literal('remove') }),
  ]),
  // The editor's tab, which holds the edit hold (design 24g).
  z.object({ editTabId: z.string().min(1) }),
)
