import { href } from "react-router"

import type { Breadcrumb } from "~/types/breadcrumb"

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: "Redakce",
      path: href("/administration/editorial-board"),
    }
  },
}
