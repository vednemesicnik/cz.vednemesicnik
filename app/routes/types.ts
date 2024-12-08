import type { Params, UIMatch } from "react-router"

export interface CustomUIMatch<RouteParams extends Params<string>, LoaderData>
  extends UIMatch {
  params: RouteParams
  data: LoaderData
}
