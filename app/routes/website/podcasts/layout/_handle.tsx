import { href } from "react-router"

import type { Breadcrumb } from "~/types/breadcrumb"

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: "Podcasty",
      path: href("/podcasts"),
    }
  },
}
