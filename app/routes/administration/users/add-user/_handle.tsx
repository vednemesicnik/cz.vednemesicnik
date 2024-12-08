import { Link } from "react-router"

export const handle = {
  breadcrumb: () => {
    return <Link to={`/administration/users/add-user`}>Přidat uživatele</Link>
  },
}
