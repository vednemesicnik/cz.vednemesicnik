import { Link } from "react-router"

export const handle = {
  breadcrumb: () => {
    return <Link to={`/administration/users`}>Uživatelé</Link>
  },
}
