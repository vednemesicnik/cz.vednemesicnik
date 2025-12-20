import { prisma } from '~/utils/db.server'
import { throwDbError } from '~/utils/throw-db-error.server'

type Args = {
  linkId: string
  label: string
  url: string
}

export async function updateLink({ linkId, label, url }: Args) {
  try {
    await prisma.podcastEpisodeLink.update({
      data: {
        label,
        url,
      },
      where: { id: linkId },
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, 'Unable to update the link.')
  }
}
