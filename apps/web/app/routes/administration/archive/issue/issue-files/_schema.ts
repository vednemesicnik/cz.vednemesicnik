import { z } from 'zod'

const kind = z.enum(['cover', 'pdf'])

/** One change of the issue editor's files, saved on its own (design 26c). */
export const schema = z.intersection(
  z.discriminatedUnion('intent', [
    z.object({ file: z.instanceof(File), intent: z.literal('upload'), kind }),
    z.object({ intent: z.literal('remove'), kind }),
  ]),
  // The editor's tab, which holds the edit hold (design 24g).
  z.object({ editTabId: z.string().min(1) }),
)

/** Which of the issue's files a change is about. */
export type IssueFileKind = z.infer<typeof kind>
