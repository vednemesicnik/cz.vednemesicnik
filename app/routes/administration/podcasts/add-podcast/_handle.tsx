import { Link } from "react-router"

export const handle = {
  breadcrumb: () => {
    return (
      <Link to={`/administration/podcasts/add-podcast`}>Přidat podcast</Link>
    )
  },
}
