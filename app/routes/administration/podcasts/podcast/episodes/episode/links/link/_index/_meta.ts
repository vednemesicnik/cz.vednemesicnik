import type { Route } from './+types/route'

export const meta = ({ loaderData }: Route.MetaArgs) => {
  const title = loaderData?.link.label ?? 'Detail odkazu'
  return [{ title: `${title} | Administrace` }]
}
