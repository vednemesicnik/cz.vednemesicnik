import { href } from "react-router"

import type { Breadcrumb } from "~/types/breadcrumb"

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: "Archiv",
      path: href("/administration/archive"),
    }
  },
}
