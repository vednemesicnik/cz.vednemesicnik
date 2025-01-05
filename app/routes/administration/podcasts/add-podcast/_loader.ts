import { type LoaderFunctionArgs, redirect } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getAuthorRights } from "~/utils/get-author-rights"
import { type AuthorPermissionEntity } from "~~/types/permission"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const entities: AuthorPermissionEntity[] = ["podcast"]

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          author: {
            select: {
              id: true,
              role: {
                select: {
                  permissions: {
                    where: {
                      entity: { in: entities },
                    },
                    select: {
                      action: true,
                      access: true,
                      entity: true,
                      state: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const [
    // entity: podcast
    [
      // action: create
      [
        // access: own
        [hasCreateOwnPodcastRight],
        // access: any
        [hasRightToCreateAnyPodcast],
      ],
    ],
  ] = getAuthorRights(session.user.author.role.permissions, {
    entities: ["podcast"],
    actions: ["create"],
    access: ["own", "any"],
  })

  if (!(hasCreateOwnPodcastRight || hasRightToCreateAnyPodcast)) {
    throw redirect("/administration/podcasts")
  }

  const authors = await prisma.author.findMany({
    ...(hasRightToCreateAnyPodcast
      ? {}
      : { where: { id: session.user.author.id } }),
    select: {
      id: true,
      name: true,
    },
  })

  return { session, authors }
}
