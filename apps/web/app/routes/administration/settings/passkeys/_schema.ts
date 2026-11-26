import { z } from 'zod'

export const schema = z.object({
  passkeyId: z.string({ message: 'Chybí identifikátor passkey' }),
})
