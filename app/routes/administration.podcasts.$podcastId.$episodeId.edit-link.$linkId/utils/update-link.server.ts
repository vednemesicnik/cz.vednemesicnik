import { prisma } from "~/utils/db.server"
import { throwDbError } from "~/utils/throw-db-error.server"

type Args = {
  linkId: string
  label: string
  url: string
}

export async function updateLink({ linkId, label, url }: Args) {
  try {
    await prisma.podcastEpisodeLink.update({
      where: { id: linkId },
      data: {
        label,
        url,
      },
    })
  } catch (error) {
    throwDbError(error, "Unable to update the link.")
  }
}
