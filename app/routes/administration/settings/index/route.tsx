import { Link } from "react-router";

export default function Route() {
  return (
    <>
      <h3>Nastavení</h3>

      <Link to={"/administration/settings/profile"}>Profil</Link>
    </>
  )
}

export { meta } from "./_meta"
