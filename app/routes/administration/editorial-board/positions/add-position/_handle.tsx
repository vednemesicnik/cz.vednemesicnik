import { href } from "react-router"

import type { Breadcrumb } from "~/types/breadcrumb"

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: "Přidat pozici",
      path: href("/administration/editorial-board/positions/add-position"),
    }
  },
}
