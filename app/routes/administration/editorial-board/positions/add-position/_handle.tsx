import { Link } from "react-router"

export const handle = {
  breadcrumb: () => {
    return (
      <Link to={`/administration/editorial-board/positions/add-position`}>
        Přidat pozici
      </Link>
    )
  },
}
