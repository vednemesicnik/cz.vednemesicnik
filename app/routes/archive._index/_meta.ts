import type { MetaFunction } from "@remix-run/node"

export const meta: MetaFunction = () => {
  return [
    { title: "Vedneměsíčník | Archiv" },
    { name: "description", content: "Archiv čísel Vedneměsíčníku" },
  ]
}