import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          id: true,
          role: {
            select: {
              permissions: {
                where: {
                  entity: {
                    in: [
                      "archived_issue",
                      "editorial_board_member",
                      "editorial_board_member_position",
                      "podcast",
                      "user",
                    ],
                  },
                },
                select: {
                  entity: true,
                  action: true,
                  access: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return json({ session })
}
