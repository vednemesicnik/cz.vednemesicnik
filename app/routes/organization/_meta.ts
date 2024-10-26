import type { MetaFunction } from "@remix-run/node"

export const meta: MetaFunction = () => {
  return [
    { title: "Vedneměsíčník | Spolek" },
    { name: "description", content: "O spolku Vedneměsíčník, z. s." },
  ]
}