// noinspection JSUnusedGlobalSymbols

import type { Route } from "./+types/route"

export { loader } from "./_loader"

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { latestIssue, latestPodcastEpisode } = loaderData

  return (
    <div>
      <h1>Links</h1>
      <p>Links page content goes here.</p>
      <h2>Latest Issue</h2>
      <code>{JSON.stringify(latestIssue)}</code>
      <h2>Latest Podcast Episode</h2>
      <code>{JSON.stringify(latestPodcastEpisode)}</code>
    </div>
  )
}
