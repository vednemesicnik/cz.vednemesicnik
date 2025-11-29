import { href } from "react-router"

import type { Breadcrumb } from "~/types/breadcrumb"

export const handle = {
  breadcrumb: (): Breadcrumb => {
    return {
      label: "Nové číslo",
      path: href("/administration/archive/new-issue"),
    }
  },
}
