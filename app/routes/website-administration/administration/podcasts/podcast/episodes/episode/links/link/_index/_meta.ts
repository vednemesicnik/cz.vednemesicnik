import type { Route } from "./+types/route"

export const meta = ({ data }: Route.MetaArgs) => {
  const title = data?.link.label ?? "Detail odkazu"
  return [{ title: `${title} | Administrace` }]
}