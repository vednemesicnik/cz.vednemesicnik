import { Link } from "react-router"

export const handle = {
  breadcrumb: () => {
    return <Link to={`/administration/archive/add-issue`}>Přidat výtisk</Link>
  },
}
