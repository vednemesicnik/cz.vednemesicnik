import { z } from 'zod'

/** One change of the episode's own cover, saved on its own (design 27d). */
export const schema = z.intersection(
  z.discriminatedUnion('intent', [
    z.object({ file: z.instanceof(File), intent: z.literal('upload') }),
    z.object({ intent: z.literal('remove') }),
  ]),
  // The editor's tab, which holds the edit hold (design 24g).
  z.object({ editTabId: z.string().min(1) }),
)
