// noinspection JSUnusedGlobalSymbols

import { type LoaderFunctionArgs } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"resources/podcast-episode-cover/:id">,
  string
>

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params as RouteParams

  const image = await prisma.podcastEpisodeCover.findUnique({
    where: { id: id },
    select: { contentType: true, blob: true },
  })

  if (image === null)
    return new Response("Podcast episode cover not found.", { status: 400 })

  return new Response(image.blob, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Length": Buffer.byteLength(image.blob).toString(),
      "Content-Disposition": `inline; filename="${id}"`,
      "Cache-Control": "public, max-age=31536000, immutable", // 31536000 seconds = 365 days
    },
  })
}
