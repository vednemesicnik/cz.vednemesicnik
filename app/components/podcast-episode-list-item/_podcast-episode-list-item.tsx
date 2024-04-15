import type { ReactNode } from "react"

type Props = {
  children: ReactNode
}

export function PodcastEpisodeListItem({ children }: Props) {
  return (
    <li>
      <article>{children}</article>
    </li>
  )
}
