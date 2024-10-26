import type { MetaFunction } from "@remix-run/node"

export const meta: MetaFunction = () => {
  return [
    { title: "Vedneměsíčník" },
    { name: "description", content: "Studentské nekritické noviny" },
  ]
}