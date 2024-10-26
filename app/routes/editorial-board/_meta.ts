import type { MetaFunction } from "@remix-run/node"

export const meta: MetaFunction = () => {
  return [
    { title: "Vedneměsíčník | Redakce" },
    {
      name: "description",
      content: "Seznam členů a kontakt na redakci Vedneměsíčníku.",
    },
  ]
}